'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  name: 'sequelize-connect',
  // This is an initializer in denali itself that actually defines the models
  // To define them requires connecting to the DB so we do that first
  before: 'define-orm-models',

  initialize: function _callee(application) {
    var container, config, connection;
    return _regenerator2.default.async(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          container = application.container;
          config = application.config.database;
          _context.prev = 2;
          connection = new _sequelize2.default(config.url, config.options || {});
          _context.next = 6;
          return _regenerator2.default.awrap(connection.authenticate());

        case 6:
          container.register('database:sequelize', connection, { singleton: true });
          _context.next = 13;
          break;

        case 9:
          _context.prev = 9;
          _context.t0 = _context['catch'](2);

          application.logger.error('Error initializing the database connection:');
          application.logger.error(_context.t0.stack);

        case 13:
        case 'end':
          return _context.stop();
      }
    }, null, this, [[2, 9]]);
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbmZpZy9pbml0aWFsaXplcnMvc2VxdWVsaXplLWNvbm5lY3QuanMiXSwibmFtZXMiOlsibmFtZSIsImJlZm9yZSIsImluaXRpYWxpemUiLCJhcHBsaWNhdGlvbiIsImNvbnRhaW5lciIsImNvbmZpZyIsImRhdGFiYXNlIiwiY29ubmVjdGlvbiIsInVybCIsIm9wdGlvbnMiLCJhdXRoZW50aWNhdGUiLCJyZWdpc3RlciIsInNpbmdsZXRvbiIsImxvZ2dlciIsImVycm9yIiwic3RhY2siXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQTs7Ozs7O2tCQUVlO0FBQ2JBLFFBQU0sbUJBRE87QUFFYjtBQUNBO0FBQ0FDLFVBQVEsbUJBSks7O0FBTVBDLFlBTk8sbUJBTUlDLFdBTko7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQU9QQyxtQkFQTyxHQU9LRCxZQUFZQyxTQVBqQjtBQVFQQyxnQkFSTyxHQVFFRixZQUFZRSxNQUFaLENBQW1CQyxRQVJyQjtBQUFBO0FBV0xDLG9CQVhLLEdBV1Esd0JBQWNGLE9BQU9HLEdBQXJCLEVBQTBCSCxPQUFPSSxPQUFQLElBQWtCLEVBQTVDLENBWFI7QUFBQTtBQUFBLDZDQVlIRixXQUFXRyxZQUFYLEVBWkc7O0FBQUE7QUFhVE4sb0JBQVVPLFFBQVYsQ0FBbUIsb0JBQW5CLEVBQXlDSixVQUF6QyxFQUFxRCxFQUFFSyxXQUFXLElBQWIsRUFBckQ7QUFiUztBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFlVFQsc0JBQVlVLE1BQVosQ0FBbUJDLEtBQW5CLENBQXlCLDZDQUF6QjtBQUNBWCxzQkFBWVUsTUFBWixDQUFtQkMsS0FBbkIsQ0FBeUIsWUFBTUMsS0FBL0I7O0FBaEJTO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEMiLCJmaWxlIjoiY29uZmlnL2luaXRpYWxpemVycy9zZXF1ZWxpemUtY29ubmVjdC5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvYWNidXJkaW5lL1Byb2plY3RzL2RlbmFsaS9kZW5hbGktc2VxdWVsaXplIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFNlcXVlbGl6ZSBmcm9tICdzZXF1ZWxpemUnO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIG5hbWU6ICdzZXF1ZWxpemUtY29ubmVjdCcsXG4gIC8vIFRoaXMgaXMgYW4gaW5pdGlhbGl6ZXIgaW4gZGVuYWxpIGl0c2VsZiB0aGF0IGFjdHVhbGx5IGRlZmluZXMgdGhlIG1vZGVsc1xuICAvLyBUbyBkZWZpbmUgdGhlbSByZXF1aXJlcyBjb25uZWN0aW5nIHRvIHRoZSBEQiBzbyB3ZSBkbyB0aGF0IGZpcnN0XG4gIGJlZm9yZTogJ2RlZmluZS1vcm0tbW9kZWxzJyxcblxuICBhc3luYyBpbml0aWFsaXplKGFwcGxpY2F0aW9uKSB7XG4gICAgbGV0IGNvbnRhaW5lciA9IGFwcGxpY2F0aW9uLmNvbnRhaW5lcjtcbiAgICBsZXQgY29uZmlnID0gYXBwbGljYXRpb24uY29uZmlnLmRhdGFiYXNlO1xuXG4gICAgdHJ5IHtcbiAgICAgIGxldCBjb25uZWN0aW9uID0gbmV3IFNlcXVlbGl6ZShjb25maWcudXJsLCBjb25maWcub3B0aW9ucyB8fCB7fSk7XG4gICAgICBhd2FpdCBjb25uZWN0aW9uLmF1dGhlbnRpY2F0ZSgpO1xuICAgICAgY29udGFpbmVyLnJlZ2lzdGVyKCdkYXRhYmFzZTpzZXF1ZWxpemUnLCBjb25uZWN0aW9uLCB7IHNpbmdsZXRvbjogdHJ1ZSB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgYXBwbGljYXRpb24ubG9nZ2VyLmVycm9yKCdFcnJvciBpbml0aWFsaXppbmcgdGhlIGRhdGFiYXNlIGNvbm5lY3Rpb246Jyk7XG4gICAgICBhcHBsaWNhdGlvbi5sb2dnZXIuZXJyb3IoZXJyb3Iuc3RhY2spO1xuICAgIH1cbiAgfVxufTtcbiJdfQ==