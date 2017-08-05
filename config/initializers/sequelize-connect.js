import Sequelize from 'sequelize';

export default {
  name: 'sequelize-connect',
  // This is an initializer in denali itself that actually defines the models
  // To define them requires connecting to the DB so we do that first
  before: 'define-orm-models',

  async initialize(application) {
    let container = application.container;
    let config = application.config.database;

    try {
      let connection = new Sequelize(config.url, config.options || {});
      await connection.authenticate();
      container.register('database:sequelize', connection, { singleton: true });
    } catch (error) {
      application.logger.error('Error initializing the database connection:');
      application.logger.error(error.stack);
    }
  }
};
