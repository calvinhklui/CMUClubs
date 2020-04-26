import React from 'react';
import { Form, Button, Col, Alert } from 'react-bootstrap';
import logo from '../images/BTG Logo Color Isolate.png';

class Recruit extends React.Component {
  constructor(props) {
    super(props);

    this.address = 'http://127.0.0.1:8000';

    this.storeTokens = this.storeTokens.bind(this);
    this.retrieveTokens = this.retrieveTokens.bind(this);
    this.clearTokens = this.clearTokens.bind(this);

    this.fetchUserData = this.fetchUserData.bind(this);

    this.state = {
      logged_in: localStorage.getItem('access') ? true : false,
      andrew: '',
      club_name: '',
      successful_query: '',
      valid_query: false,
      error_message: ''
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

  fetchUserData() {
    if (this.state.logged_in) {
      // obtain information for current user
      fetch(this.address + '/self/', {
        headers: {
          Authorization: `Bearer ${this.retrieveTokens().access}`
        }
      })
        .then(res => res.json())
        .then(json => {

          // store information for current user
          if (typeof json.results !== 'undefined') {
            this.setState({
              club_name: json.results[0].club.name
            });
          }

          // need to obtain a new access token
          else {
            fetch(this.address + '/api/token/refresh/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                refresh: this.retrieveTokens().refresh
              })
            })
              .then(res => res.json())
              .then(json => {
                if (typeof json.access !== 'undefined') {
                  // store new access token, keep old refresh token
                  this.storeTokens(json.access, false);
                } else {
                  // need to login again
                  this.setState({
                    logged_in: false
                  })
                  localStorage.clear();
                  window.location.href = "/login/";
                }
              });

            // call self again
            this.fetchUserData();
          }
        });
    }
  }

  componentDidMount() {
    this.fetchUserData();
  }

  handleQuery = (e, data) => {
    data = { andrew_id: data.andrew };

    e.preventDefault();
    fetch(this.address + '/members/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.retrieveTokens().access}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(json => {

        console.log(json)

        // valid andrew id
        if (typeof json.andrew_id !== 'undefined') {
          this.setState({
            successful_query: json.first_name,
            invalid_query: false,
            andrew: ''
          });
        }

        // invalid andrew id
        else {
          this.setState({
            invalid_query: true,
            error_message: json.errors[0].join('').replace("__all__,",'')
          });
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
      this.handleQuery();
    }
  }

  render() {
    if (!this.state.logged_in) {
      this.props.history.push('/login');
    }

    return (
      <React.Fragment>
      <div className="centered">
        <div className="body-container">
          <div className="body-content">
            <p className="page-header">{this.state.club_name}</p>

            <br />

            {this.state.successful_query !== '' && !this.state.invalid_query &&
              <Alert variant={'success'}>
                {this.state.successful_query}, you have been added to the list!
              </Alert>
            }

            {this.state.invalid_query &&
              <Alert variant={'danger'}>
                {this.state.error_message}
              </Alert>
            }

            <Form>
              <Form.Group className="nice-input" as={Form.Row} controlId="formHorizontalAndrew">
                <Form.Label column sm={3}>Andrew ID</Form.Label>
                <Col sm={9}>
                  <Form.Control className="form-control no-border"
                                type="text"
                                name="andrew"
                                value={this.state.andrew}
                                onChange={this.handleChange}
                                placeholder="Enter Andrew ID" />
                </Col>
              </Form.Group>

              <Button className="form-button"
                      variant="primary"
                      type="submit"
                      onClick={e => this.handleQuery(e, this.state)}>
                Join
              </Button>
            </Form>
          </div>
          <div className="footer">
              Powered by CMUBTG
              &nbsp;
              <a href="http://cmubtg.com" target="_blank" rel="noopener noreferrer">
                <img
                  src={logo}
                  width="25"
                  className="d-inline-block align-top"
                  alt="CMUBTG"
                />
              </a>
            </div>
        </div>
      </div>
      </React.Fragment>
    );
  }
}

export default Recruit;
