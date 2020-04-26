import React from 'react';
import { Form, Button, Col, Alert } from 'react-bootstrap';
import logo from '../images/BTG Logo Color Isolate.png';

class Login extends React.Component {
  constructor(props) {
    super(props);

    this.address = 'http://127.0.0.1:8000';

    this.storeTokens = this.storeTokens.bind(this);
    this.retrieveTokens = this.retrieveTokens.bind(this);
    this.clearTokens = this.clearTokens.bind(this);

    this.state = {
      logged_in: localStorage.getItem('access') ? true : false,
      username: '',
      password: '',
      invalid_login: false
    };
  }

  storeTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem('access', accessToken);
    if (refreshToken) localStorage.setItem('refresh', refreshToken);
  }

  retrieveTokens() {
    var accessToken = localStorage.getItem('access');
    var refreshToken = localStorage.getItem('refresh');

    return {
      access: accessToken,
      refresh: refreshToken
    }
  }

  clearTokens(accessToken, refreshToken) {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  }

  handleLogin = (e, data) => {
    e.preventDefault();
    fetch(this.address + '/api/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(json => {

        // successful login
        if (typeof json.access !== 'undefined') {
          this.storeTokens(json.access, json.refresh);

          // redirect to home page
          this.props.history.push('/');
        }

        // failed login
        else {
          this.setState({ invalid_login: true });
        }
      });
  };

  handleChange = e => {
    const name = e.target.name;
    const value = e.target.value;
    this.setState(prevstate => {
      const newState = { ...prevstate };
      newState[name] = value;
      return newState;
    });
  };

  _handleKeyDown = (event) => {
    if (event.keyCode === 13) {
      this.handleLogin();
    }
  }

  render() {
    if (this.state.logged_in) {
      this.props.history.push('/');
    }

    return (
      <React.Fragment>
      <div className="centered">
        <div className="body-container">
          <div className="body-content">
            <img
              src={logo}
              width="100"
              className="d-inline-block align-top"
              alt="CMUBTG"
            />

            <br /><br /><br />

            {this.state.invalid_login &&
              <Alert variant={'danger'}>
                Username or password invalid.
              </Alert>
            }

            <Form>
              <Form.Group className="nice-input" as={Form.Row} controlId="formHorizontalUsername">
                <Form.Label column sm={3}>Username</Form.Label>
                <Col sm={9}>
                  <Form.Control className="form-control no-border"
                                type="text"
                                name="username"
                                value={this.state.username}
                                onChange={this.handleChange}
                                placeholder="Enter Username" />
                </Col>
              </Form.Group>

              <Form.Group className="nice-input" as={Form.Row} controlId="formHorizontalPassword">
                <Form.Label column sm={3}>Password</Form.Label>
                <Col sm={9}>
                  <Form.Control type="password"
                                name="password"
                                value={this.state.password}
                                onChange={this.handleChange}
                                placeholder="Enter Password" />
                </Col>
              </Form.Group>

              <Button className="form-button"
                      variant="primary"
                      type="submit"
                      onClick={e => this.handleLogin(e, this.state)}>
                Login
              </Button>
            </Form>
          </div>
        </div>
      </div>
      </React.Fragment>
    );
  }
}

export default Login;

Login.propTypes = {
  // handleLogin: PropTypes.func.isRequired
};
