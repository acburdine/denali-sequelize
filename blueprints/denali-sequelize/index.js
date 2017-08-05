'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _denaliCli = require('denali-cli');

// This blueprint is run when denali-sequelize is installed via `denali install`. It's a good spot to
// make any changes to the consuming app or addon, i.e. create a config file, add a route, etc
class DenaliSequelizeBlueprint extends _denaliCli.Blueprint {

  locals() /* argv */{}

}
exports.default = DenaliSequelizeBlueprint;
DenaliSequelizeBlueprint.blueprintName = 'denali-sequelize';
DenaliSequelizeBlueprint.description = 'Installs denali-sequelize';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJsdWVwcmludHMvZGVuYWxpLXNlcXVlbGl6ZS9pbmRleC5qcyJdLCJuYW1lcyI6WyJEZW5hbGlTZXF1ZWxpemVCbHVlcHJpbnQiLCJsb2NhbHMiLCJibHVlcHJpbnROYW1lIiwiZGVzY3JpcHRpb24iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOztBQUVBO0FBQ0E7QUFDZSxNQUFNQSx3QkFBTiw4QkFBaUQ7O0FBSzlEQyxXQUFPLFVBQVksQ0FBRTs7QUFMeUM7a0JBQTNDRCx3QjtBQUFBQSx3QixDQUVaRSxhLEdBQWdCLGtCO0FBRkpGLHdCLENBR1pHLFcsR0FBYywyQiIsImZpbGUiOiJibHVlcHJpbnRzL2RlbmFsaS1zZXF1ZWxpemUvaW5kZXguanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL2FjYnVyZGluZS9Qcm9qZWN0cy9kZW5hbGkvZGVuYWxpLXNlcXVlbGl6ZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJsdWVwcmludCB9IGZyb20gJ2RlbmFsaS1jbGknO1xuXG4vLyBUaGlzIGJsdWVwcmludCBpcyBydW4gd2hlbiBkZW5hbGktc2VxdWVsaXplIGlzIGluc3RhbGxlZCB2aWEgYGRlbmFsaSBpbnN0YWxsYC4gSXQncyBhIGdvb2Qgc3BvdCB0b1xuLy8gbWFrZSBhbnkgY2hhbmdlcyB0byB0aGUgY29uc3VtaW5nIGFwcCBvciBhZGRvbiwgaS5lLiBjcmVhdGUgYSBjb25maWcgZmlsZSwgYWRkIGEgcm91dGUsIGV0Y1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGVuYWxpU2VxdWVsaXplQmx1ZXByaW50IGV4dGVuZHMgQmx1ZXByaW50IHtcblxuICBzdGF0aWMgYmx1ZXByaW50TmFtZSA9ICdkZW5hbGktc2VxdWVsaXplJztcbiAgc3RhdGljIGRlc2NyaXB0aW9uID0gJ0luc3RhbGxzIGRlbmFsaS1zZXF1ZWxpemUnO1xuXG4gIGxvY2FscygvKiBhcmd2ICovKSB7fVxuXG59XG4iXX0=