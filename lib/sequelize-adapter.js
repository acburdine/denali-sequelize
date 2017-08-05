import { ORMAdapter, inject } from 'denali';
import Sequelize from 'sequelize';
import filter from 'lodash/filter';
import assign from 'lodash/assign';
import mapKeys from 'lodash/mapKeys';
import snakeCase from 'lodash/snakeCase';
import isObject from 'lodash/isObject';
import upperFirst from 'lodash/upperFirst';

const { DataTypes, QueryTypes } = Sequelize;

const COMMON_ALIASES = {
  bool: 'boolean',
  int: 'integer'
};

export default class SequelizeAdapter extends ORMAdapter {

  sequelize = inject('database:sequelize');

  /**
   * Find a record by id.
   */
  find(type, id, options) {
    let OrmModel = this.sequelize.model(type);
    return OrmModel.findById(id, options);
  }

  /**
   * Find a single record that matches the given query.
   */
  queryOne(type, query, options) {
    let OrmModel = this.sequelize.model(type);
    return OrmModel.find(assign({
      where: this.buildWhere(query)
    }, options));
  }

  /**
   * Find all records of this type.
   */
  all(type, options) {
    let OrmModel = this.sequelize.model(type);
    return OrmModel.findAll(options);
  }

  /**
   * Find all records that match the given query.
   */
  query(type, query, options) {
    let OrmModel = this.sequelize.model(type);
    return OrmModel.findAll(assign({
      where: this.buildWhere(query)
    }, options));
  }

  count(type, query, options) {
    let OrmModel = this.sequelize.model(type);
    return OrmModel.count(assign({
      where: this.buildWhere(query)
    }, options));
  }

  /**
   * Run a specific query (handles some of the boilerplate code involved)
   *
   * @param {String} query
   * @param {Object} options All valid options to pass to Sequelize#query, as well as:
   * @return Promise<any>
   */
  rawQuery(query, options = {}) {
    let { type } = options;
    delete options.type;

    return this.sequelize.query(query, assign({
      raw: true,
      type: type && QueryTypes[type.toUpperCase()]
    }, options));
  }

  /**
   * Return the id for the given model.
   */
  idFor(model) {
    let OrmModel = this.sequelize.model(model.type);
    let primaryKeys = Object.keys(OrmModel.primaryKeys);

    if (primaryKeys.length > 1) {
      return primaryKeys.reduce((obj, key) => {
        obj[key] = model.record.get(key);
        return obj;
      }, {});
    }

    return model.record.get(primaryKeys[0]);
  }

  /**
   * Set the id for the given model.
   */
  setId(model, value) {
    let { primaryKeys } = this.sequelize.model(model.type);

    if (primaryKeys.length === 1) {
      model.record.set(primaryKeys[0], value);
      return;
    }

    if (!isObject(value) || Object.keys(value).length !== primaryKeys.length) {
      throw new Error('Failed to set composite primary key: value was not an object or did not have enough values');
    }

    primaryKeys.forEach((key) => {
      model.record.set(key, value[key]);
    });
  }

  /**
   * Build an internal record instance of the given type with the given data. Note that this method
   * should return the internal, ORM representation of the record, not a Denali Model.
   */
  buildRecord(type, data, options) {
    let OrmModel = this.sequelize.model(type);

    // Sequelize queries will actually return instances of the OrmModel class,
    // so we need to not try and build it again if it's already an OrmModel
    if (data instanceof OrmModel) {
      return data;
    }

    return OrmModel.build(data, assign({
      isNewRecord: false // buildRecord really only creates existing records so this needs to be false
    }, options));
  }

  /**
   * Return the value for the given attribute on the given record.
   */
  getAttribute(model, attribute) {
    return model.record.get(attribute);
  }

  /**
   * Set the value for the given attribute on the given record.
   *
   * @returns returns true if set operation was successful
   */
  setAttribute(model, attribute, value) {
    model.record.set(attribute, value);
    return true;
  }

  /**
   * Delete the value for the given attribute on the given record. The semantics of this may behave
   * slightly differently depending on backend - SQL databases may NULL out the value, while
   * document stores like Mongo may actually delete the key from the document (rather than just
   * nulling it out)
   *
   * @returns returns true if delete operation was successful
   */
  deleteAttribute(model, attribute) {
    let attributeDefinition = this.sequelize.model(model.type).attributes[attribute];

    if (!attributeDefinition.allowNull) {
      throw new Error(`Cannot set non-nullable attribute '${ attribute }' to null.`);
    }

    model.record.set(attribute, null);
    return true;
  }

  /**
   * Return the related record(s) for the given relationship.
   *
   * @param model The model whose related records are being fetched
   * @param relationship The name of the relationship on the model that should be fetched
   * @param descriptor The RelationshipDescriptor of the relationship being fetch
   * @param query An optional query to filter the related records by
   */
  getRelated(model, relationship, descriptor, options = {}) {
    let methodName = `get${ upperFirst(relationship) }`;

    return model.record[methodName](assign({
      where: this.buildWhere(options.query || {})
    }, options));
  }

  /**
   * Set the related record(s) for the given relationship. Note: for has-many relationships, the
   * entire set of existing related records should be replaced by the supplied records. The old
   * related records should be "unlinked" in their relationship. Whether that results in the
   * deletion of those old records is up to the ORM adapter, although it is recommended that they
   * not be deleted unless the user has explicitly expressed that intent.
   *
   * @param model The model whose related records are being altered
   * @param relationship The name of the relationship on the model that should be altered
   * @param descriptor The RelationshipDescriptor of the relationship being altered
   * @param related The related record(s) that should be linked to the given relationship
   */
  async setRelated(model, relationship, descriptor, related, options) {
    let methodName = `set${ upperFirst(relationship) }`;
    let multiple = Array.isArray(related);

    if (descriptor.type === 'hasOne' && multiple) {
      throw new Error(`You must pass a single value to a hasOne relationship`);
    } else if (descriptor.type === 'hasMany' && !multiple) {
      related = [ related ];
    }

    let records = multiple ? related.map((relatedModel) => relatedModel.record) : related.record;

    await model.record[methodName](records, options);
    return true;
  }

  /**
   * Add related record(s) to a hasMany relationship. Existing related records should remain
   * unaltered.
   *
   * @param model The model whose related records are being altered
   * @param relationship The name of the relationship on the model that should be altered
   * @param descriptor The RelationshipDescriptor of the relationship being altered
   * @param related The related record(s) that should be linked to the given relationship
   */
  async addRelated(model, relationship, descriptor, related, options) {
    if (descriptor.type === 'hasOne') {
      throw new Error('You cannot add related models to a hasOne relationship. Use `setRelated` instead.');
    }

    let records = Array.isArray(related) ? related.map((relatedModel) => relatedModel.record) : [ related.record ];
    // Technically sequelize supports both singular and plural versions of the add<Relationship> method,
    // but to simplify things we'll just use the plural version.
    await model.record[`add${ upperFirst(relationship) }`](records, options);
    return true;
  }

  /**
   * Remove related record(s) from a hasMany relationship. Note: The removed related records should
   * be "unlinked" in their relationship. Whether that results in the deletion of those old records
   * is up to the ORM adapter, although it is recommended that they not be deleted unless the user
   * has explicitly expressed that intent.
   *
   * @param model The model whose related records are being altered
   * @param relationship The name of the relationship on the model that should be altered
   * @param descriptor The RelationshipDescriptor of the relationship being altered
   * @param related The related record(s) that should be removed from the relationship; if not
   *                provided, then all related records should be removed
   */
  async removeRelated(model, relationship, descriptor, related, options) {
    if (descriptor.type === 'hasOne') {
      // In sequelize, removing a record doesn't work on a hasOne or belongsTo, so we need to
      // call setRelated with a null related object
      await this.setRelated(model, relationship, descriptor, null, options);
      return true;
    }

    await model.record[`remove${ upperFirst(relationship) }`](related, options);
    return true;
  }

  /**
   * Persist the supplied model.
   */
  saveRecord(model, options) {
    return model.record.save(options);
  }

  /**
   * Delete the supplied model from the persistent data store.
   */
  deleteRecord(model, options) {
    return model.record.destroy(options);
  }

  /**
   * Takes an array of Denali Models and defines an ORM specific model class, and/or any other ORM
   * specific setup that might be required for that Model.
   */
  defineModels(models) {
    models.forEach((Model) => {
      let modelType = this.container.metaFor(Model).containerName;
      let attributes = {};

      Model.mapAttributeDescriptors((attribute, key) => {
        attributes[key] = assign({
          type: this.mapType(attribute.type, attribute.options),
          field: this.keyToColumn(key),
          allowNull: false // we use NOT NULL (almost) everywhere, but sequelize doesn't have a way to make allowNull false by default
        }, attribute.options);
      });

      let hasPrimaryKeys = Boolean(filter(attributes, (attr) => attr.primaryKey || false).length);

      // If no custom primary keys are specified, we'll go ahead and add one to the attributes object
      // this makes is a bit easier to write models, as most of the tables use the same type of autogenerated
      // id as the primary key
      if (!hasPrimaryKeys) {
        attributes.id = {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          autoIncrement: true
        };
      }

      this.sequelize.define(modelType, attributes, assign({
        tableName: this.normalizeTableName(modelType)
      }, Model.sequelizeOptions || {}));
    });

    models.forEach((Model) => {
      let modelType = this.container.metaFor(Model).containerName;

      Model.mapRelationshipDescriptors(({ type, mode, options }, key) => {
        let OrmModel = this.sequelize.model(modelType);
        let Related = this.sequelize.model(type);

        // Theoretically we should support both hasOne and belongsTo relationships here,
        // but because Denali only supports 'hasOne' relationships we'll just default to
        // belongsTo.... need to think how to best specify options to support both
        // TODO: revisit
        if (mode === 'hasOne') {
          OrmModel.belongsTo(Related, assign({
            as: key
          }, options));
        } else {
          OrmModel.hasMany(Related, assign({
            as: key
          }, options));
        }
      });
    });
  }

  mapType(type, options) {
    if (COMMON_ALIASES[type]) {
      type = COMMON_ALIASES[type];
    }

    if (!DataTypes[type.toUpperCase()]) {
      throw new Error(`${ type } is not a valid Sequelize type.`);
    }

    // TODO make this more configurable so more types are supported
    if (options.length) {
      return DataTypes[type.toUpperCase()](options.length);
    }

    return DataTypes[type.toUpperCase()];
  }

  keyToColumn(key) {
    return snakeCase(key);
  }

  normalizeTableName(modelType) {
    return snakeCase(modelType);
  }

  /**
   * This is a map shorthand that is used enough places to make it a worthwhile private
   * utility function
   *
   * Also has some helpers to handle searching by belongsTo attributes
   *
   * @param {Model} OrmModel Sequelize Model
   * @param {Object} query
   */
  buildWhere(query) {
    return mapKeys(query, (v, key) => this.keyToColumn(key));
  }

  /**
   * Start a transaction that will wrap a test, and be rolled back afterwards. If the data store
   * doesn't support transactions, just omit this method. Only one test transaction will be opened
   * per process, and the ORM adapter is responsible for keeping track of that transaction so it
   * can later be rolled back.
   */
  async startTestTransaction() {
    this.testTransaction = await this.sequelize.transaction();
  }

  /**
   * Roll back the test transaction.
   */
  async rollbackTestTransaction() {
    await this.testTransaction.rollback();
    this.testTransaction = null;
  }

  /**
   * The current test transaction, if applicable
   */
  testTransaction;

}
