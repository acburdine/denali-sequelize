'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _denali = require('denali');

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _filter = require('lodash/filter');

var _filter2 = _interopRequireDefault(_filter);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _mapKeys = require('lodash/mapKeys');

var _mapKeys2 = _interopRequireDefault(_mapKeys);

var _snakeCase = require('lodash/snakeCase');

var _snakeCase2 = _interopRequireDefault(_snakeCase);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _upperFirst = require('lodash/upperFirst');

var _upperFirst2 = _interopRequireDefault(_upperFirst);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const DataTypes = _sequelize2.default.DataTypes,
      QueryTypes = _sequelize2.default.QueryTypes;


const COMMON_ALIASES = {
  bool: 'boolean',
  int: 'integer'
};

class SequelizeAdapter extends _denali.ORMAdapter {
  constructor(...args) {
    var _temp;

    return _temp = super(...args), this.sequelize = (0, _denali.inject)('database:sequelize'), _temp;
  }

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
    return OrmModel.find((0, _assign2.default)({
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
    return OrmModel.findAll((0, _assign2.default)({
      where: this.buildWhere(query)
    }, options));
  }

  count(type, query, options) {
    let OrmModel = this.sequelize.model(type);
    return OrmModel.count((0, _assign2.default)({
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
    let type = options.type;

    delete options.type;

    return this.sequelize.query(query, (0, _assign2.default)({
      raw: true,
      type: type && QueryTypes[type.toUpperCase()]
    }, options));
  }

  /**
   * Return the id for the given model.
   */
  idFor(model) {
    let OrmModel = this.sequelize.model(model.type);
    let primaryKeys = (0, _keys2.default)(OrmModel.primaryKeys);

    if (primaryKeys.length > 1) {
      return primaryKeys.reduce(function (obj, key) {
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
    var _sequelize$model = this.sequelize.model(model.type);

    let primaryKeys = _sequelize$model.primaryKeys;


    if (primaryKeys.length === 1) {
      model.record.set(primaryKeys[0], value);
      return;
    }

    if (!(0, _isObject2.default)(value) || (0, _keys2.default)(value).length !== primaryKeys.length) {
      throw new Error('Failed to set composite primary key: value was not an object or did not have enough values');
    }

    primaryKeys.forEach(function (key) {
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

    return OrmModel.build(data, (0, _assign2.default)({
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
      throw new Error('Cannot set non-nullable attribute \'' + attribute + '\' to null.');
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
    let methodName = 'get' + (0, _upperFirst2.default)(relationship);

    return model.record[methodName]((0, _assign2.default)({
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
  setRelated(model, relationship, descriptor, related, options) {
    var methodName, multiple, records;
    return _regenerator2.default.async(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          methodName = 'set' + (0, _upperFirst2.default)(relationship);
          multiple = Array.isArray(related);

          if (!(descriptor.type === 'hasOne' && multiple)) {
            _context.next = 6;
            break;
          }

          throw new Error('You must pass a single value to a hasOne relationship');

        case 6:
          if (descriptor.type === 'hasMany' && !multiple) {
            related = [related];
          }

        case 7:
          records = multiple ? related.map(function (relatedModel) {
            return relatedModel.record;
          }) : related.record;
          _context.next = 10;
          return _regenerator2.default.awrap(model.record[methodName](records, options));

        case 10:
          return _context.abrupt('return', true);

        case 11:
        case 'end':
          return _context.stop();
      }
    }, null, this);
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
  addRelated(model, relationship, descriptor, related, options) {
    var records;
    return _regenerator2.default.async(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          if (!(descriptor.type === 'hasOne')) {
            _context2.next = 2;
            break;
          }

          throw new Error('You cannot add related models to a hasOne relationship. Use `setRelated` instead.');

        case 2:
          records = Array.isArray(related) ? related.map(function (relatedModel) {
            return relatedModel.record;
          }) : [related.record];
          // Technically sequelize supports both singular and plural versions of the add<Relationship> method,
          // but to simplify things we'll just use the plural version.

          _context2.next = 5;
          return _regenerator2.default.awrap(model.record['add' + (0, _upperFirst2.default)(relationship)](records, options));

        case 5:
          return _context2.abrupt('return', true);

        case 6:
        case 'end':
          return _context2.stop();
      }
    }, null, this);
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
  removeRelated(model, relationship, descriptor, related, options) {
    return _regenerator2.default.async(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          if (!(descriptor.type === 'hasOne')) {
            _context3.next = 4;
            break;
          }

          _context3.next = 3;
          return _regenerator2.default.awrap(this.setRelated(model, relationship, descriptor, null, options));

        case 3:
          return _context3.abrupt('return', true);

        case 4:
          _context3.next = 6;
          return _regenerator2.default.awrap(model.record['remove' + (0, _upperFirst2.default)(relationship)](related, options));

        case 6:
          return _context3.abrupt('return', true);

        case 7:
        case 'end':
          return _context3.stop();
      }
    }, null, this);
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
    var _this = this;

    models.forEach(function (Model) {
      let modelType = _this.container.metaFor(Model).containerName;
      let attributes = {};

      Model.mapAttributeDescriptors(function (attribute, key) {
        attributes[key] = (0, _assign2.default)({
          type: _this.mapType(attribute.type, attribute.options),
          field: _this.keyToColumn(key),
          allowNull: false // we use NOT NULL (almost) everywhere, but sequelize doesn't have a way to make allowNull false by default
        }, attribute.options);
      });

      let hasPrimaryKeys = Boolean((0, _filter2.default)(attributes, function (attr) {
        return attr.primaryKey || false;
      }).length);

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

      _this.sequelize.define(modelType, attributes, (0, _assign2.default)({
        tableName: _this.normalizeTableName(modelType)
      }, Model.sequelizeOptions || {}));
    });

    models.forEach(function (Model) {
      let modelType = _this.container.metaFor(Model).containerName;

      Model.mapRelationshipDescriptors(function ({ type: type, mode: mode, options: options }, key) {
        let OrmModel = _this.sequelize.model(modelType);
        let Related = _this.sequelize.model(type);

        // Theoretically we should support both hasOne and belongsTo relationships here,
        // but because Denali only supports 'hasOne' relationships we'll just default to
        // belongsTo.... need to think how to best specify options to support both
        // TODO: revisit
        if (mode === 'hasOne') {
          OrmModel.belongsTo(Related, (0, _assign2.default)({
            as: key
          }, options));
        } else {
          OrmModel.hasMany(Related, (0, _assign2.default)({
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
      throw new Error(type + ' is not a valid Sequelize type.');
    }

    if (options.typeArgs && Array.isArray(options.typeArgs)) {
      return DataTypes[type.toUpperCase()].apply(DataTypes, (0, _toConsumableArray3.default)(options.typeArgs));
    }

    return DataTypes[type.toUpperCase()];
  }

  keyToColumn(key) {
    return (0, _snakeCase2.default)(key);
  }

  normalizeTableName(modelType) {
    return (0, _snakeCase2.default)(modelType);
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
    var _this2 = this;

    return (0, _mapKeys2.default)(query, function (v, key) {
      return _this2.keyToColumn(key);
    });
  }

  /**
   * Start a transaction that will wrap a test, and be rolled back afterwards. If the data store
   * doesn't support transactions, just omit this method. Only one test transaction will be opened
   * per process, and the ORM adapter is responsible for keeping track of that transaction so it
   * can later be rolled back.
   */
  startTestTransaction() {
    return _regenerator2.default.async(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return _regenerator2.default.awrap(this.sequelize.transaction());

        case 2:
          this.testTransaction = _context4.sent;

        case 3:
        case 'end':
          return _context4.stop();
      }
    }, null, this);
  }

  /**
   * Roll back the test transaction.
   */
  rollbackTestTransaction() {
    return _regenerator2.default.async(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return _regenerator2.default.awrap(this.testTransaction.rollback());

        case 2:
          this.testTransaction = null;

        case 3:
        case 'end':
          return _context5.stop();
      }
    }, null, this);
  }

  /**
   * The current test transaction, if applicable
   */
}
exports.default = SequelizeAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXF1ZWxpemUtYWRhcHRlci5qcyJdLCJuYW1lcyI6WyJEYXRhVHlwZXMiLCJRdWVyeVR5cGVzIiwiQ09NTU9OX0FMSUFTRVMiLCJib29sIiwiaW50IiwiU2VxdWVsaXplQWRhcHRlciIsInNlcXVlbGl6ZSIsImZpbmQiLCJ0eXBlIiwiaWQiLCJvcHRpb25zIiwiT3JtTW9kZWwiLCJtb2RlbCIsImZpbmRCeUlkIiwicXVlcnlPbmUiLCJxdWVyeSIsIndoZXJlIiwiYnVpbGRXaGVyZSIsImFsbCIsImZpbmRBbGwiLCJjb3VudCIsInJhd1F1ZXJ5IiwicmF3IiwidG9VcHBlckNhc2UiLCJpZEZvciIsInByaW1hcnlLZXlzIiwibGVuZ3RoIiwicmVkdWNlIiwib2JqIiwia2V5IiwicmVjb3JkIiwiZ2V0Iiwic2V0SWQiLCJ2YWx1ZSIsInNldCIsIkVycm9yIiwiZm9yRWFjaCIsImJ1aWxkUmVjb3JkIiwiZGF0YSIsImJ1aWxkIiwiaXNOZXdSZWNvcmQiLCJnZXRBdHRyaWJ1dGUiLCJhdHRyaWJ1dGUiLCJzZXRBdHRyaWJ1dGUiLCJkZWxldGVBdHRyaWJ1dGUiLCJhdHRyaWJ1dGVEZWZpbml0aW9uIiwiYXR0cmlidXRlcyIsImFsbG93TnVsbCIsImdldFJlbGF0ZWQiLCJyZWxhdGlvbnNoaXAiLCJkZXNjcmlwdG9yIiwibWV0aG9kTmFtZSIsInNldFJlbGF0ZWQiLCJyZWxhdGVkIiwibXVsdGlwbGUiLCJBcnJheSIsImlzQXJyYXkiLCJyZWNvcmRzIiwibWFwIiwicmVsYXRlZE1vZGVsIiwiYWRkUmVsYXRlZCIsInJlbW92ZVJlbGF0ZWQiLCJzYXZlUmVjb3JkIiwic2F2ZSIsImRlbGV0ZVJlY29yZCIsImRlc3Ryb3kiLCJkZWZpbmVNb2RlbHMiLCJtb2RlbHMiLCJNb2RlbCIsIm1vZGVsVHlwZSIsImNvbnRhaW5lciIsIm1ldGFGb3IiLCJjb250YWluZXJOYW1lIiwibWFwQXR0cmlidXRlRGVzY3JpcHRvcnMiLCJtYXBUeXBlIiwiZmllbGQiLCJrZXlUb0NvbHVtbiIsImhhc1ByaW1hcnlLZXlzIiwiQm9vbGVhbiIsImF0dHIiLCJwcmltYXJ5S2V5IiwiSU5URUdFUiIsImF1dG9JbmNyZW1lbnQiLCJkZWZpbmUiLCJ0YWJsZU5hbWUiLCJub3JtYWxpemVUYWJsZU5hbWUiLCJzZXF1ZWxpemVPcHRpb25zIiwibWFwUmVsYXRpb25zaGlwRGVzY3JpcHRvcnMiLCJtb2RlIiwiUmVsYXRlZCIsImJlbG9uZ3NUbyIsImFzIiwiaGFzTWFueSIsInR5cGVBcmdzIiwidiIsInN0YXJ0VGVzdFRyYW5zYWN0aW9uIiwidHJhbnNhY3Rpb24iLCJ0ZXN0VHJhbnNhY3Rpb24iLCJyb2xsYmFja1Rlc3RUcmFuc2FjdGlvbiIsInJvbGxiYWNrIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O01BRVFBLFMsdUJBQUFBLFM7TUFBV0MsVSx1QkFBQUEsVTs7O0FBRW5CLE1BQU1DLGlCQUFpQjtBQUNyQkMsUUFBTSxTQURlO0FBRXJCQyxPQUFLO0FBRmdCLENBQXZCOztBQUtlLE1BQU1DLGdCQUFOLDRCQUEwQztBQUFBO0FBQUE7O0FBQUEsd0NBRXZEQyxTQUZ1RCxHQUUzQyxvQkFBTyxvQkFBUCxDQUYyQztBQUFBOztBQUl2RDs7O0FBR0FDLE9BQUtDLElBQUwsRUFBV0MsRUFBWCxFQUFlQyxPQUFmLEVBQXdCO0FBQ3RCLFFBQUlDLFdBQVcsS0FBS0wsU0FBTCxDQUFlTSxLQUFmLENBQXFCSixJQUFyQixDQUFmO0FBQ0EsV0FBT0csU0FBU0UsUUFBVCxDQUFrQkosRUFBbEIsRUFBc0JDLE9BQXRCLENBQVA7QUFDRDs7QUFFRDs7O0FBR0FJLFdBQVNOLElBQVQsRUFBZU8sS0FBZixFQUFzQkwsT0FBdEIsRUFBK0I7QUFDN0IsUUFBSUMsV0FBVyxLQUFLTCxTQUFMLENBQWVNLEtBQWYsQ0FBcUJKLElBQXJCLENBQWY7QUFDQSxXQUFPRyxTQUFTSixJQUFU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QUE7QUFBQTtBQUFBOztBQUtBOzs7QUFyWHVEO2tCQUFwQzVGLGdCIiwiZmlsZSI6ImxpYi9zZXF1ZWxpemUtYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvYWNidXJkaW5lL1Byb2plY3RzL2RlbmFsaS9kZW5hbGktc2VxdWVsaXplIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT1JNQWRhcHRlciwgaW5qZWN0IH0gZnJvbSAnZGVuYWxpJztcbmltcG9ydCBTZXF1ZWxpemUgZnJvbSAnc2VxdWVsaXplJztcbmltcG9ydCBmaWx0ZXIgZnJvbSAnbG9kYXNoL2ZpbHRlcic7XG5pbXBvcnQgYXNzaWduIGZyb20gJ2xvZGFzaC9hc3NpZ24nO1xuaW1wb3J0IG1hcEtleXMgZnJvbSAnbG9kYXNoL21hcEtleXMnO1xuaW1wb3J0IHNuYWtlQ2FzZSBmcm9tICdsb2Rhc2gvc25ha2VDYXNlJztcbmltcG9ydCBpc09iamVjdCBmcm9tICdsb2Rhc2gvaXNPYmplY3QnO1xuaW1wb3J0IHVwcGVyRmlyc3QgZnJvbSAnbG9kYXNoL3VwcGVyRmlyc3QnO1xuXG5jb25zdCB7IERhdGFUeXBlcywgUXVlcnlUeXBlcyB9ID0gU2VxdWVsaXplO1xuXG5jb25zdCBDT01NT05fQUxJQVNFUyA9IHtcbiAgYm9vbDogJ2Jvb2xlYW4nLFxuICBpbnQ6ICdpbnRlZ2VyJ1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VxdWVsaXplQWRhcHRlciBleHRlbmRzIE9STUFkYXB0ZXIge1xuXG4gIHNlcXVlbGl6ZSA9IGluamVjdCgnZGF0YWJhc2U6c2VxdWVsaXplJyk7XG5cbiAgLyoqXG4gICAqIEZpbmQgYSByZWNvcmQgYnkgaWQuXG4gICAqL1xuICBmaW5kKHR5cGUsIGlkLCBvcHRpb25zKSB7XG4gICAgbGV0IE9ybU1vZGVsID0gdGhpcy5zZXF1ZWxpemUubW9kZWwodHlwZSk7XG4gICAgcmV0dXJuIE9ybU1vZGVsLmZpbmRCeUlkKGlkLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kIGEgc2luZ2xlIHJlY29yZCB0aGF0IG1hdGNoZXMgdGhlIGdpdmVuIHF1ZXJ5LlxuICAgKi9cbiAgcXVlcnlPbmUodHlwZSwgcXVlcnksIG9wdGlvbnMpIHtcbiAgICBsZXQgT3JtTW9kZWwgPSB0aGlzLnNlcXVlbGl6ZS5tb2RlbCh0eXBlKTtcbiAgICByZXR1cm4gT3JtTW9kZWwuZmluZChhc3NpZ24oe1xuICAgICAgd2hlcmU6IHRoaXMuYnVpbGRXaGVyZShxdWVyeSlcbiAgICB9LCBvcHRpb25zKSk7XG4gIH1cblxuICAvKipcbiAgICogRmluZCBhbGwgcmVjb3JkcyBvZiB0aGlzIHR5cGUuXG4gICAqL1xuICBhbGwodHlwZSwgb3B0aW9ucykge1xuICAgIGxldCBPcm1Nb2RlbCA9IHRoaXMuc2VxdWVsaXplLm1vZGVsKHR5cGUpO1xuICAgIHJldHVybiBPcm1Nb2RlbC5maW5kQWxsKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmQgYWxsIHJlY29yZHMgdGhhdCBtYXRjaCB0aGUgZ2l2ZW4gcXVlcnkuXG4gICAqL1xuICBxdWVyeSh0eXBlLCBxdWVyeSwgb3B0aW9ucykge1xuICAgIGxldCBPcm1Nb2RlbCA9IHRoaXMuc2VxdWVsaXplLm1vZGVsKHR5cGUpO1xuICAgIHJldHVybiBPcm1Nb2RlbC5maW5kQWxsKGFzc2lnbih7XG4gICAgICB3aGVyZTogdGhpcy5idWlsZFdoZXJlKHF1ZXJ5KVxuICAgIH0sIG9wdGlvbnMpKTtcbiAgfVxuXG4gIGNvdW50KHR5cGUsIHF1ZXJ5LCBvcHRpb25zKSB7XG4gICAgbGV0IE9ybU1vZGVsID0gdGhpcy5zZXF1ZWxpemUubW9kZWwodHlwZSk7XG4gICAgcmV0dXJuIE9ybU1vZGVsLmNvdW50KGFzc2lnbih7XG4gICAgICB3aGVyZTogdGhpcy5idWlsZFdoZXJlKHF1ZXJ5KVxuICAgIH0sIG9wdGlvbnMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYSBzcGVjaWZpYyBxdWVyeSAoaGFuZGxlcyBzb21lIG9mIHRoZSBib2lsZXJwbGF0ZSBjb2RlIGludm9sdmVkKVxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcXVlcnlcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgQWxsIHZhbGlkIG9wdGlvbnMgdG8gcGFzcyB0byBTZXF1ZWxpemUjcXVlcnksIGFzIHdlbGwgYXM6XG4gICAqIEByZXR1cm4gUHJvbWlzZTxhbnk+XG4gICAqL1xuICByYXdRdWVyeShxdWVyeSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgbGV0IHsgdHlwZSB9ID0gb3B0aW9ucztcbiAgICBkZWxldGUgb3B0aW9ucy50eXBlO1xuXG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHF1ZXJ5LCBhc3NpZ24oe1xuICAgICAgcmF3OiB0cnVlLFxuICAgICAgdHlwZTogdHlwZSAmJiBRdWVyeVR5cGVzW3R5cGUudG9VcHBlckNhc2UoKV1cbiAgICB9LCBvcHRpb25zKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSBpZCBmb3IgdGhlIGdpdmVuIG1vZGVsLlxuICAgKi9cbiAgaWRGb3IobW9kZWwpIHtcbiAgICBsZXQgT3JtTW9kZWwgPSB0aGlzLnNlcXVlbGl6ZS5tb2RlbChtb2RlbC50eXBlKTtcbiAgICBsZXQgcHJpbWFyeUtleXMgPSBPYmplY3Qua2V5cyhPcm1Nb2RlbC5wcmltYXJ5S2V5cyk7XG5cbiAgICBpZiAocHJpbWFyeUtleXMubGVuZ3RoID4gMSkge1xuICAgICAgcmV0dXJuIHByaW1hcnlLZXlzLnJlZHVjZSgob2JqLCBrZXkpID0+IHtcbiAgICAgICAgb2JqW2tleV0gPSBtb2RlbC5yZWNvcmQuZ2V0KGtleSk7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgICB9LCB7fSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vZGVsLnJlY29yZC5nZXQocHJpbWFyeUtleXNbMF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgaWQgZm9yIHRoZSBnaXZlbiBtb2RlbC5cbiAgICovXG4gIHNldElkKG1vZGVsLCB2YWx1ZSkge1xuICAgIGxldCB7IHByaW1hcnlLZXlzIH0gPSB0aGlzLnNlcXVlbGl6ZS5tb2RlbChtb2RlbC50eXBlKTtcblxuICAgIGlmIChwcmltYXJ5S2V5cy5sZW5ndGggPT09IDEpIHtcbiAgICAgIG1vZGVsLnJlY29yZC5zZXQocHJpbWFyeUtleXNbMF0sIHZhbHVlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIWlzT2JqZWN0KHZhbHVlKSB8fCBPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoICE9PSBwcmltYXJ5S2V5cy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIHNldCBjb21wb3NpdGUgcHJpbWFyeSBrZXk6IHZhbHVlIHdhcyBub3QgYW4gb2JqZWN0IG9yIGRpZCBub3QgaGF2ZSBlbm91Z2ggdmFsdWVzJyk7XG4gICAgfVxuXG4gICAgcHJpbWFyeUtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBtb2RlbC5yZWNvcmQuc2V0KGtleSwgdmFsdWVba2V5XSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW4gaW50ZXJuYWwgcmVjb3JkIGluc3RhbmNlIG9mIHRoZSBnaXZlbiB0eXBlIHdpdGggdGhlIGdpdmVuIGRhdGEuIE5vdGUgdGhhdCB0aGlzIG1ldGhvZFxuICAgKiBzaG91bGQgcmV0dXJuIHRoZSBpbnRlcm5hbCwgT1JNIHJlcHJlc2VudGF0aW9uIG9mIHRoZSByZWNvcmQsIG5vdCBhIERlbmFsaSBNb2RlbC5cbiAgICovXG4gIGJ1aWxkUmVjb3JkKHR5cGUsIGRhdGEsIG9wdGlvbnMpIHtcbiAgICBsZXQgT3JtTW9kZWwgPSB0aGlzLnNlcXVlbGl6ZS5tb2RlbCh0eXBlKTtcblxuICAgIC8vIFNlcXVlbGl6ZSBxdWVyaWVzIHdpbGwgYWN0dWFsbHkgcmV0dXJuIGluc3RhbmNlcyBvZiB0aGUgT3JtTW9kZWwgY2xhc3MsXG4gICAgLy8gc28gd2UgbmVlZCB0byBub3QgdHJ5IGFuZCBidWlsZCBpdCBhZ2FpbiBpZiBpdCdzIGFscmVhZHkgYW4gT3JtTW9kZWxcbiAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIE9ybU1vZGVsKSB7XG4gICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG5cbiAgICByZXR1cm4gT3JtTW9kZWwuYnVpbGQoZGF0YSwgYXNzaWduKHtcbiAgICAgIGlzTmV3UmVjb3JkOiBmYWxzZSAvLyBidWlsZFJlY29yZCByZWFsbHkgb25seSBjcmVhdGVzIGV4aXN0aW5nIHJlY29yZHMgc28gdGhpcyBuZWVkcyB0byBiZSBmYWxzZVxuICAgIH0sIG9wdGlvbnMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHZhbHVlIGZvciB0aGUgZ2l2ZW4gYXR0cmlidXRlIG9uIHRoZSBnaXZlbiByZWNvcmQuXG4gICAqL1xuICBnZXRBdHRyaWJ1dGUobW9kZWwsIGF0dHJpYnV0ZSkge1xuICAgIHJldHVybiBtb2RlbC5yZWNvcmQuZ2V0KGF0dHJpYnV0ZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSB2YWx1ZSBmb3IgdGhlIGdpdmVuIGF0dHJpYnV0ZSBvbiB0aGUgZ2l2ZW4gcmVjb3JkLlxuICAgKlxuICAgKiBAcmV0dXJucyByZXR1cm5zIHRydWUgaWYgc2V0IG9wZXJhdGlvbiB3YXMgc3VjY2Vzc2Z1bFxuICAgKi9cbiAgc2V0QXR0cmlidXRlKG1vZGVsLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgbW9kZWwucmVjb3JkLnNldChhdHRyaWJ1dGUsIHZhbHVlKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhlIHZhbHVlIGZvciB0aGUgZ2l2ZW4gYXR0cmlidXRlIG9uIHRoZSBnaXZlbiByZWNvcmQuIFRoZSBzZW1hbnRpY3Mgb2YgdGhpcyBtYXkgYmVoYXZlXG4gICAqIHNsaWdodGx5IGRpZmZlcmVudGx5IGRlcGVuZGluZyBvbiBiYWNrZW5kIC0gU1FMIGRhdGFiYXNlcyBtYXkgTlVMTCBvdXQgdGhlIHZhbHVlLCB3aGlsZVxuICAgKiBkb2N1bWVudCBzdG9yZXMgbGlrZSBNb25nbyBtYXkgYWN0dWFsbHkgZGVsZXRlIHRoZSBrZXkgZnJvbSB0aGUgZG9jdW1lbnQgKHJhdGhlciB0aGFuIGp1c3RcbiAgICogbnVsbGluZyBpdCBvdXQpXG4gICAqXG4gICAqIEByZXR1cm5zIHJldHVybnMgdHJ1ZSBpZiBkZWxldGUgb3BlcmF0aW9uIHdhcyBzdWNjZXNzZnVsXG4gICAqL1xuICBkZWxldGVBdHRyaWJ1dGUobW9kZWwsIGF0dHJpYnV0ZSkge1xuICAgIGxldCBhdHRyaWJ1dGVEZWZpbml0aW9uID0gdGhpcy5zZXF1ZWxpemUubW9kZWwobW9kZWwudHlwZSkuYXR0cmlidXRlc1thdHRyaWJ1dGVdO1xuXG4gICAgaWYgKCFhdHRyaWJ1dGVEZWZpbml0aW9uLmFsbG93TnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3Qgc2V0IG5vbi1udWxsYWJsZSBhdHRyaWJ1dGUgJyR7IGF0dHJpYnV0ZSB9JyB0byBudWxsLmApO1xuICAgIH1cblxuICAgIG1vZGVsLnJlY29yZC5zZXQoYXR0cmlidXRlLCBudWxsKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHJlbGF0ZWQgcmVjb3JkKHMpIGZvciB0aGUgZ2l2ZW4gcmVsYXRpb25zaGlwLlxuICAgKlxuICAgKiBAcGFyYW0gbW9kZWwgVGhlIG1vZGVsIHdob3NlIHJlbGF0ZWQgcmVjb3JkcyBhcmUgYmVpbmcgZmV0Y2hlZFxuICAgKiBAcGFyYW0gcmVsYXRpb25zaGlwIFRoZSBuYW1lIG9mIHRoZSByZWxhdGlvbnNoaXAgb24gdGhlIG1vZGVsIHRoYXQgc2hvdWxkIGJlIGZldGNoZWRcbiAgICogQHBhcmFtIGRlc2NyaXB0b3IgVGhlIFJlbGF0aW9uc2hpcERlc2NyaXB0b3Igb2YgdGhlIHJlbGF0aW9uc2hpcCBiZWluZyBmZXRjaFxuICAgKiBAcGFyYW0gcXVlcnkgQW4gb3B0aW9uYWwgcXVlcnkgdG8gZmlsdGVyIHRoZSByZWxhdGVkIHJlY29yZHMgYnlcbiAgICovXG4gIGdldFJlbGF0ZWQobW9kZWwsIHJlbGF0aW9uc2hpcCwgZGVzY3JpcHRvciwgb3B0aW9ucyA9IHt9KSB7XG4gICAgbGV0IG1ldGhvZE5hbWUgPSBgZ2V0JHsgdXBwZXJGaXJzdChyZWxhdGlvbnNoaXApIH1gO1xuXG4gICAgcmV0dXJuIG1vZGVsLnJlY29yZFttZXRob2ROYW1lXShhc3NpZ24oe1xuICAgICAgd2hlcmU6IHRoaXMuYnVpbGRXaGVyZShvcHRpb25zLnF1ZXJ5IHx8IHt9KVxuICAgIH0sIG9wdGlvbnMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHJlbGF0ZWQgcmVjb3JkKHMpIGZvciB0aGUgZ2l2ZW4gcmVsYXRpb25zaGlwLiBOb3RlOiBmb3IgaGFzLW1hbnkgcmVsYXRpb25zaGlwcywgdGhlXG4gICAqIGVudGlyZSBzZXQgb2YgZXhpc3RpbmcgcmVsYXRlZCByZWNvcmRzIHNob3VsZCBiZSByZXBsYWNlZCBieSB0aGUgc3VwcGxpZWQgcmVjb3Jkcy4gVGhlIG9sZFxuICAgKiByZWxhdGVkIHJlY29yZHMgc2hvdWxkIGJlIFwidW5saW5rZWRcIiBpbiB0aGVpciByZWxhdGlvbnNoaXAuIFdoZXRoZXIgdGhhdCByZXN1bHRzIGluIHRoZVxuICAgKiBkZWxldGlvbiBvZiB0aG9zZSBvbGQgcmVjb3JkcyBpcyB1cCB0byB0aGUgT1JNIGFkYXB0ZXIsIGFsdGhvdWdoIGl0IGlzIHJlY29tbWVuZGVkIHRoYXQgdGhleVxuICAgKiBub3QgYmUgZGVsZXRlZCB1bmxlc3MgdGhlIHVzZXIgaGFzIGV4cGxpY2l0bHkgZXhwcmVzc2VkIHRoYXQgaW50ZW50LlxuICAgKlxuICAgKiBAcGFyYW0gbW9kZWwgVGhlIG1vZGVsIHdob3NlIHJlbGF0ZWQgcmVjb3JkcyBhcmUgYmVpbmcgYWx0ZXJlZFxuICAgKiBAcGFyYW0gcmVsYXRpb25zaGlwIFRoZSBuYW1lIG9mIHRoZSByZWxhdGlvbnNoaXAgb24gdGhlIG1vZGVsIHRoYXQgc2hvdWxkIGJlIGFsdGVyZWRcbiAgICogQHBhcmFtIGRlc2NyaXB0b3IgVGhlIFJlbGF0aW9uc2hpcERlc2NyaXB0b3Igb2YgdGhlIHJlbGF0aW9uc2hpcCBiZWluZyBhbHRlcmVkXG4gICAqIEBwYXJhbSByZWxhdGVkIFRoZSByZWxhdGVkIHJlY29yZChzKSB0aGF0IHNob3VsZCBiZSBsaW5rZWQgdG8gdGhlIGdpdmVuIHJlbGF0aW9uc2hpcFxuICAgKi9cbiAgYXN5bmMgc2V0UmVsYXRlZChtb2RlbCwgcmVsYXRpb25zaGlwLCBkZXNjcmlwdG9yLCByZWxhdGVkLCBvcHRpb25zKSB7XG4gICAgbGV0IG1ldGhvZE5hbWUgPSBgc2V0JHsgdXBwZXJGaXJzdChyZWxhdGlvbnNoaXApIH1gO1xuICAgIGxldCBtdWx0aXBsZSA9IEFycmF5LmlzQXJyYXkocmVsYXRlZCk7XG5cbiAgICBpZiAoZGVzY3JpcHRvci50eXBlID09PSAnaGFzT25lJyAmJiBtdWx0aXBsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBZb3UgbXVzdCBwYXNzIGEgc2luZ2xlIHZhbHVlIHRvIGEgaGFzT25lIHJlbGF0aW9uc2hpcGApO1xuICAgIH0gZWxzZSBpZiAoZGVzY3JpcHRvci50eXBlID09PSAnaGFzTWFueScgJiYgIW11bHRpcGxlKSB7XG4gICAgICByZWxhdGVkID0gWyByZWxhdGVkIF07XG4gICAgfVxuXG4gICAgbGV0IHJlY29yZHMgPSBtdWx0aXBsZSA/IHJlbGF0ZWQubWFwKChyZWxhdGVkTW9kZWwpID0+IHJlbGF0ZWRNb2RlbC5yZWNvcmQpIDogcmVsYXRlZC5yZWNvcmQ7XG5cbiAgICBhd2FpdCBtb2RlbC5yZWNvcmRbbWV0aG9kTmFtZV0ocmVjb3Jkcywgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQWRkIHJlbGF0ZWQgcmVjb3JkKHMpIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXAuIEV4aXN0aW5nIHJlbGF0ZWQgcmVjb3JkcyBzaG91bGQgcmVtYWluXG4gICAqIHVuYWx0ZXJlZC5cbiAgICpcbiAgICogQHBhcmFtIG1vZGVsIFRoZSBtb2RlbCB3aG9zZSByZWxhdGVkIHJlY29yZHMgYXJlIGJlaW5nIGFsdGVyZWRcbiAgICogQHBhcmFtIHJlbGF0aW9uc2hpcCBUaGUgbmFtZSBvZiB0aGUgcmVsYXRpb25zaGlwIG9uIHRoZSBtb2RlbCB0aGF0IHNob3VsZCBiZSBhbHRlcmVkXG4gICAqIEBwYXJhbSBkZXNjcmlwdG9yIFRoZSBSZWxhdGlvbnNoaXBEZXNjcmlwdG9yIG9mIHRoZSByZWxhdGlvbnNoaXAgYmVpbmcgYWx0ZXJlZFxuICAgKiBAcGFyYW0gcmVsYXRlZCBUaGUgcmVsYXRlZCByZWNvcmQocykgdGhhdCBzaG91bGQgYmUgbGlua2VkIHRvIHRoZSBnaXZlbiByZWxhdGlvbnNoaXBcbiAgICovXG4gIGFzeW5jIGFkZFJlbGF0ZWQobW9kZWwsIHJlbGF0aW9uc2hpcCwgZGVzY3JpcHRvciwgcmVsYXRlZCwgb3B0aW9ucykge1xuICAgIGlmIChkZXNjcmlwdG9yLnR5cGUgPT09ICdoYXNPbmUnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBjYW5ub3QgYWRkIHJlbGF0ZWQgbW9kZWxzIHRvIGEgaGFzT25lIHJlbGF0aW9uc2hpcC4gVXNlIGBzZXRSZWxhdGVkYCBpbnN0ZWFkLicpO1xuICAgIH1cblxuICAgIGxldCByZWNvcmRzID0gQXJyYXkuaXNBcnJheShyZWxhdGVkKSA/IHJlbGF0ZWQubWFwKChyZWxhdGVkTW9kZWwpID0+IHJlbGF0ZWRNb2RlbC5yZWNvcmQpIDogWyByZWxhdGVkLnJlY29yZCBdO1xuICAgIC8vIFRlY2huaWNhbGx5IHNlcXVlbGl6ZSBzdXBwb3J0cyBib3RoIHNpbmd1bGFyIGFuZCBwbHVyYWwgdmVyc2lvbnMgb2YgdGhlIGFkZDxSZWxhdGlvbnNoaXA+IG1ldGhvZCxcbiAgICAvLyBidXQgdG8gc2ltcGxpZnkgdGhpbmdzIHdlJ2xsIGp1c3QgdXNlIHRoZSBwbHVyYWwgdmVyc2lvbi5cbiAgICBhd2FpdCBtb2RlbC5yZWNvcmRbYGFkZCR7IHVwcGVyRmlyc3QocmVsYXRpb25zaGlwKSB9YF0ocmVjb3Jkcywgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIHJlbGF0ZWQgcmVjb3JkKHMpIGZyb20gYSBoYXNNYW55IHJlbGF0aW9uc2hpcC4gTm90ZTogVGhlIHJlbW92ZWQgcmVsYXRlZCByZWNvcmRzIHNob3VsZFxuICAgKiBiZSBcInVubGlua2VkXCIgaW4gdGhlaXIgcmVsYXRpb25zaGlwLiBXaGV0aGVyIHRoYXQgcmVzdWx0cyBpbiB0aGUgZGVsZXRpb24gb2YgdGhvc2Ugb2xkIHJlY29yZHNcbiAgICogaXMgdXAgdG8gdGhlIE9STSBhZGFwdGVyLCBhbHRob3VnaCBpdCBpcyByZWNvbW1lbmRlZCB0aGF0IHRoZXkgbm90IGJlIGRlbGV0ZWQgdW5sZXNzIHRoZSB1c2VyXG4gICAqIGhhcyBleHBsaWNpdGx5IGV4cHJlc3NlZCB0aGF0IGludGVudC5cbiAgICpcbiAgICogQHBhcmFtIG1vZGVsIFRoZSBtb2RlbCB3aG9zZSByZWxhdGVkIHJlY29yZHMgYXJlIGJlaW5nIGFsdGVyZWRcbiAgICogQHBhcmFtIHJlbGF0aW9uc2hpcCBUaGUgbmFtZSBvZiB0aGUgcmVsYXRpb25zaGlwIG9uIHRoZSBtb2RlbCB0aGF0IHNob3VsZCBiZSBhbHRlcmVkXG4gICAqIEBwYXJhbSBkZXNjcmlwdG9yIFRoZSBSZWxhdGlvbnNoaXBEZXNjcmlwdG9yIG9mIHRoZSByZWxhdGlvbnNoaXAgYmVpbmcgYWx0ZXJlZFxuICAgKiBAcGFyYW0gcmVsYXRlZCBUaGUgcmVsYXRlZCByZWNvcmQocykgdGhhdCBzaG91bGQgYmUgcmVtb3ZlZCBmcm9tIHRoZSByZWxhdGlvbnNoaXA7IGlmIG5vdFxuICAgKiAgICAgICAgICAgICAgICBwcm92aWRlZCwgdGhlbiBhbGwgcmVsYXRlZCByZWNvcmRzIHNob3VsZCBiZSByZW1vdmVkXG4gICAqL1xuICBhc3luYyByZW1vdmVSZWxhdGVkKG1vZGVsLCByZWxhdGlvbnNoaXAsIGRlc2NyaXB0b3IsIHJlbGF0ZWQsIG9wdGlvbnMpIHtcbiAgICBpZiAoZGVzY3JpcHRvci50eXBlID09PSAnaGFzT25lJykge1xuICAgICAgLy8gSW4gc2VxdWVsaXplLCByZW1vdmluZyBhIHJlY29yZCBkb2Vzbid0IHdvcmsgb24gYSBoYXNPbmUgb3IgYmVsb25nc1RvLCBzbyB3ZSBuZWVkIHRvXG4gICAgICAvLyBjYWxsIHNldFJlbGF0ZWQgd2l0aCBhIG51bGwgcmVsYXRlZCBvYmplY3RcbiAgICAgIGF3YWl0IHRoaXMuc2V0UmVsYXRlZChtb2RlbCwgcmVsYXRpb25zaGlwLCBkZXNjcmlwdG9yLCBudWxsLCBvcHRpb25zKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGF3YWl0IG1vZGVsLnJlY29yZFtgcmVtb3ZlJHsgdXBwZXJGaXJzdChyZWxhdGlvbnNoaXApIH1gXShyZWxhdGVkLCBvcHRpb25zKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJzaXN0IHRoZSBzdXBwbGllZCBtb2RlbC5cbiAgICovXG4gIHNhdmVSZWNvcmQobW9kZWwsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbW9kZWwucmVjb3JkLnNhdmUob3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIHRoZSBzdXBwbGllZCBtb2RlbCBmcm9tIHRoZSBwZXJzaXN0ZW50IGRhdGEgc3RvcmUuXG4gICAqL1xuICBkZWxldGVSZWNvcmQobW9kZWwsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbW9kZWwucmVjb3JkLmRlc3Ryb3kob3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYW4gYXJyYXkgb2YgRGVuYWxpIE1vZGVscyBhbmQgZGVmaW5lcyBhbiBPUk0gc3BlY2lmaWMgbW9kZWwgY2xhc3MsIGFuZC9vciBhbnkgb3RoZXIgT1JNXG4gICAqIHNwZWNpZmljIHNldHVwIHRoYXQgbWlnaHQgYmUgcmVxdWlyZWQgZm9yIHRoYXQgTW9kZWwuXG4gICAqL1xuICBkZWZpbmVNb2RlbHMobW9kZWxzKSB7XG4gICAgbW9kZWxzLmZvckVhY2goKE1vZGVsKSA9PiB7XG4gICAgICBsZXQgbW9kZWxUeXBlID0gdGhpcy5jb250YWluZXIubWV0YUZvcihNb2RlbCkuY29udGFpbmVyTmFtZTtcbiAgICAgIGxldCBhdHRyaWJ1dGVzID0ge307XG5cbiAgICAgIE1vZGVsLm1hcEF0dHJpYnV0ZURlc2NyaXB0b3JzKChhdHRyaWJ1dGUsIGtleSkgPT4ge1xuICAgICAgICBhdHRyaWJ1dGVzW2tleV0gPSBhc3NpZ24oe1xuICAgICAgICAgIHR5cGU6IHRoaXMubWFwVHlwZShhdHRyaWJ1dGUudHlwZSwgYXR0cmlidXRlLm9wdGlvbnMpLFxuICAgICAgICAgIGZpZWxkOiB0aGlzLmtleVRvQ29sdW1uKGtleSksXG4gICAgICAgICAgYWxsb3dOdWxsOiBmYWxzZSAvLyB3ZSB1c2UgTk9UIE5VTEwgKGFsbW9zdCkgZXZlcnl3aGVyZSwgYnV0IHNlcXVlbGl6ZSBkb2Vzbid0IGhhdmUgYSB3YXkgdG8gbWFrZSBhbGxvd051bGwgZmFsc2UgYnkgZGVmYXVsdFxuICAgICAgICB9LCBhdHRyaWJ1dGUub3B0aW9ucyk7XG4gICAgICB9KTtcblxuICAgICAgbGV0IGhhc1ByaW1hcnlLZXlzID0gQm9vbGVhbihmaWx0ZXIoYXR0cmlidXRlcywgKGF0dHIpID0+IGF0dHIucHJpbWFyeUtleSB8fCBmYWxzZSkubGVuZ3RoKTtcblxuICAgICAgLy8gSWYgbm8gY3VzdG9tIHByaW1hcnkga2V5cyBhcmUgc3BlY2lmaWVkLCB3ZSdsbCBnbyBhaGVhZCBhbmQgYWRkIG9uZSB0byB0aGUgYXR0cmlidXRlcyBvYmplY3RcbiAgICAgIC8vIHRoaXMgbWFrZXMgaXMgYSBiaXQgZWFzaWVyIHRvIHdyaXRlIG1vZGVscywgYXMgbW9zdCBvZiB0aGUgdGFibGVzIHVzZSB0aGUgc2FtZSB0eXBlIG9mIGF1dG9nZW5lcmF0ZWRcbiAgICAgIC8vIGlkIGFzIHRoZSBwcmltYXJ5IGtleVxuICAgICAgaWYgKCFoYXNQcmltYXJ5S2V5cykge1xuICAgICAgICBhdHRyaWJ1dGVzLmlkID0ge1xuICAgICAgICAgIHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuICAgICAgICAgIHByaW1hcnlLZXk6IHRydWUsXG4gICAgICAgICAgYWxsb3dOdWxsOiBmYWxzZSxcbiAgICAgICAgICBhdXRvSW5jcmVtZW50OiB0cnVlXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc2VxdWVsaXplLmRlZmluZShtb2RlbFR5cGUsIGF0dHJpYnV0ZXMsIGFzc2lnbih7XG4gICAgICAgIHRhYmxlTmFtZTogdGhpcy5ub3JtYWxpemVUYWJsZU5hbWUobW9kZWxUeXBlKVxuICAgICAgfSwgTW9kZWwuc2VxdWVsaXplT3B0aW9ucyB8fCB7fSkpO1xuICAgIH0pO1xuXG4gICAgbW9kZWxzLmZvckVhY2goKE1vZGVsKSA9PiB7XG4gICAgICBsZXQgbW9kZWxUeXBlID0gdGhpcy5jb250YWluZXIubWV0YUZvcihNb2RlbCkuY29udGFpbmVyTmFtZTtcblxuICAgICAgTW9kZWwubWFwUmVsYXRpb25zaGlwRGVzY3JpcHRvcnMoKHsgdHlwZSwgbW9kZSwgb3B0aW9ucyB9LCBrZXkpID0+IHtcbiAgICAgICAgbGV0IE9ybU1vZGVsID0gdGhpcy5zZXF1ZWxpemUubW9kZWwobW9kZWxUeXBlKTtcbiAgICAgICAgbGV0IFJlbGF0ZWQgPSB0aGlzLnNlcXVlbGl6ZS5tb2RlbCh0eXBlKTtcblxuICAgICAgICAvLyBUaGVvcmV0aWNhbGx5IHdlIHNob3VsZCBzdXBwb3J0IGJvdGggaGFzT25lIGFuZCBiZWxvbmdzVG8gcmVsYXRpb25zaGlwcyBoZXJlLFxuICAgICAgICAvLyBidXQgYmVjYXVzZSBEZW5hbGkgb25seSBzdXBwb3J0cyAnaGFzT25lJyByZWxhdGlvbnNoaXBzIHdlJ2xsIGp1c3QgZGVmYXVsdCB0b1xuICAgICAgICAvLyBiZWxvbmdzVG8uLi4uIG5lZWQgdG8gdGhpbmsgaG93IHRvIGJlc3Qgc3BlY2lmeSBvcHRpb25zIHRvIHN1cHBvcnQgYm90aFxuICAgICAgICAvLyBUT0RPOiByZXZpc2l0XG4gICAgICAgIGlmIChtb2RlID09PSAnaGFzT25lJykge1xuICAgICAgICAgIE9ybU1vZGVsLmJlbG9uZ3NUbyhSZWxhdGVkLCBhc3NpZ24oe1xuICAgICAgICAgICAgYXM6IGtleVxuICAgICAgICAgIH0sIG9wdGlvbnMpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBPcm1Nb2RlbC5oYXNNYW55KFJlbGF0ZWQsIGFzc2lnbih7XG4gICAgICAgICAgICBhczoga2V5XG4gICAgICAgICAgfSwgb3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIG1hcFR5cGUodHlwZSwgb3B0aW9ucykge1xuICAgIGlmIChDT01NT05fQUxJQVNFU1t0eXBlXSkge1xuICAgICAgdHlwZSA9IENPTU1PTl9BTElBU0VTW3R5cGVdO1xuICAgIH1cblxuICAgIGlmICghRGF0YVR5cGVzW3R5cGUudG9VcHBlckNhc2UoKV0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHsgdHlwZSB9IGlzIG5vdCBhIHZhbGlkIFNlcXVlbGl6ZSB0eXBlLmApO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnR5cGVBcmdzICYmIEFycmF5LmlzQXJyYXkob3B0aW9ucy50eXBlQXJncykpIHtcbiAgICAgIHJldHVybiBEYXRhVHlwZXNbdHlwZS50b1VwcGVyQ2FzZSgpXSguLi5vcHRpb25zLnR5cGVBcmdzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gRGF0YVR5cGVzW3R5cGUudG9VcHBlckNhc2UoKV07XG4gIH1cblxuICBrZXlUb0NvbHVtbihrZXkpIHtcbiAgICByZXR1cm4gc25ha2VDYXNlKGtleSk7XG4gIH1cblxuICBub3JtYWxpemVUYWJsZU5hbWUobW9kZWxUeXBlKSB7XG4gICAgcmV0dXJuIHNuYWtlQ2FzZShtb2RlbFR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgaXMgYSBtYXAgc2hvcnRoYW5kIHRoYXQgaXMgdXNlZCBlbm91Z2ggcGxhY2VzIHRvIG1ha2UgaXQgYSB3b3J0aHdoaWxlIHByaXZhdGVcbiAgICogdXRpbGl0eSBmdW5jdGlvblxuICAgKlxuICAgKiBBbHNvIGhhcyBzb21lIGhlbHBlcnMgdG8gaGFuZGxlIHNlYXJjaGluZyBieSBiZWxvbmdzVG8gYXR0cmlidXRlc1xuICAgKlxuICAgKiBAcGFyYW0ge01vZGVsfSBPcm1Nb2RlbCBTZXF1ZWxpemUgTW9kZWxcbiAgICogQHBhcmFtIHtPYmplY3R9IHF1ZXJ5XG4gICAqL1xuICBidWlsZFdoZXJlKHF1ZXJ5KSB7XG4gICAgcmV0dXJuIG1hcEtleXMocXVlcnksICh2LCBrZXkpID0+IHRoaXMua2V5VG9Db2x1bW4oa2V5KSk7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnQgYSB0cmFuc2FjdGlvbiB0aGF0IHdpbGwgd3JhcCBhIHRlc3QsIGFuZCBiZSByb2xsZWQgYmFjayBhZnRlcndhcmRzLiBJZiB0aGUgZGF0YSBzdG9yZVxuICAgKiBkb2Vzbid0IHN1cHBvcnQgdHJhbnNhY3Rpb25zLCBqdXN0IG9taXQgdGhpcyBtZXRob2QuIE9ubHkgb25lIHRlc3QgdHJhbnNhY3Rpb24gd2lsbCBiZSBvcGVuZWRcbiAgICogcGVyIHByb2Nlc3MsIGFuZCB0aGUgT1JNIGFkYXB0ZXIgaXMgcmVzcG9uc2libGUgZm9yIGtlZXBpbmcgdHJhY2sgb2YgdGhhdCB0cmFuc2FjdGlvbiBzbyBpdFxuICAgKiBjYW4gbGF0ZXIgYmUgcm9sbGVkIGJhY2suXG4gICAqL1xuICBhc3luYyBzdGFydFRlc3RUcmFuc2FjdGlvbigpIHtcbiAgICB0aGlzLnRlc3RUcmFuc2FjdGlvbiA9IGF3YWl0IHRoaXMuc2VxdWVsaXplLnRyYW5zYWN0aW9uKCk7XG4gIH1cblxuICAvKipcbiAgICogUm9sbCBiYWNrIHRoZSB0ZXN0IHRyYW5zYWN0aW9uLlxuICAgKi9cbiAgYXN5bmMgcm9sbGJhY2tUZXN0VHJhbnNhY3Rpb24oKSB7XG4gICAgYXdhaXQgdGhpcy50ZXN0VHJhbnNhY3Rpb24ucm9sbGJhY2soKTtcbiAgICB0aGlzLnRlc3RUcmFuc2FjdGlvbiA9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGN1cnJlbnQgdGVzdCB0cmFuc2FjdGlvbiwgaWYgYXBwbGljYWJsZVxuICAgKi9cbiAgdGVzdFRyYW5zYWN0aW9uO1xuXG59XG4iXX0=