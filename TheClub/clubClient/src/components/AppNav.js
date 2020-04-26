import React from 'react';
import PropTypes from 'prop-types';
import { Navbar, Nav } from 'react-bootstrap';
import logo from '../images/BTG Logo Color Isolate.png';

class AppNav extends React.Component {
  state = {
    username: '',
    password: ''
  };

  exportCSV = (e) => {
    e.preventDefault();
    var data = this.props.csvData;
    var replacer = (key, value) => value === null ? '' : value
    var header = Object.keys(data[0])
    var csv = data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    csv.unshift(header.join(','))
    csv = csv.join('\r\n')

    var encodedURI = encodeURI("data:text/csv;charset=utf-8," + csv);
    window.open(encodedURI);
  };

  render() {
    return (
      <React.Fragment>
        <div>
          <Navbar bg="dark" variant="dark">

            <Navbar.Brand href="/">
              <img
                src={logo}
                width="50"
                className="d-inline-block align-top"
                alt="CMUBTG"
              />
            </Navbar.Brand>

            <Nav className="mr-auto">
            </Nav>

            <Nav>
              {this.props.logged_in ?
                <React.Fragment>
                  {this.props.csvData &&
                    <a className="btn btn-primary" href={"data:text/csv;charset=utf-8," + this.props.csvData} download="members.csv">Export CSV</a>
                  }
                  &nbsp;&nbsp;
                  <a href="/recruit" className="btn btn-danger">Recruit</a>
                  &nbsp;&nbsp;
                  <Nav.Link onClick={this.props.handleLogout}>Logout</Nav.Link>
                </React.Fragment>
                :
                <Nav.Link href="/login">Login</Nav.Link>
              }
            </Nav>

          </Navbar>
        </div>
      </React.Fragment>
    );
  }
}

export default AppNav;

AppNav.propTypes = {
  logged_in: PropTypes.bool.isRequired,
  csvData: PropTypes.string,
  handleLogout: PropTypes.func.isRequired
};
