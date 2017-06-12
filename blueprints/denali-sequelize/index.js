import { Blueprint } from 'denali-cli';

// This blueprint is run when denali-sequelize is installed via `denali install`. It's a good spot to
// make any changes to the consuming app or addon, i.e. create a config file, add a route, etc
export default class DenaliSequelizeBlueprint extends Blueprint {

  static blueprintName = 'denali-sequelize';
  static description = 'Installs denali-sequelize';

  locals(/* argv */) {}

}
