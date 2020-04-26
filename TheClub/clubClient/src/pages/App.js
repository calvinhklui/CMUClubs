import React, { Component } from 'react';
import '../stylesheets/App.css';
import AppNav from '../components/AppNav';
import MetricsCard from '../components/MetricsCard';
import { Card, Table, Alert } from 'react-bootstrap';
import Moment from 'react-moment';

class App extends Component {
  constructor(props) {
    super(props);

    this.address = 'http://127.0.0.1:8000';

    this.storeTokens = this.storeTokens.bind(this);
    this.retrieveTokens = this.retrieveTokens.bind(this);
    this.clearTokens = this.clearTokens.bind(this);

    this.fetchUserData = this.fetchUserData.bind(this);

    this.state = {
      logged_in: localStorage.getItem('access') ? true : false,
      username: '',
      club_name: '',
      members: [],
      membersCSV: null,
      metrics: null,
      deletedMember: null
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
              username: json.results[0].username,
              club_name: json.results[0].club.name,
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

            // call functions again
            this.fetchUserData();
            this.fetchMemberData();
          }
        });
    }
  }

  fetchMemberData() {
    if (this.state.logged_in) {
      // obtain members for current club
      fetch(this.address + '/members/', {
        headers: {
          Authorization: `Bearer ${this.retrieveTokens().access}`
        }
      })
        .then(res => res.json())
        .then(json => {
          // store membership for current club
          if (typeof json.results !== 'undefined') {
            // convert to csv format
            var rawData = JSON.parse(JSON.stringify(json.results));
            if (rawData[0] != null) {
              var data = [];
              for (var i = 0; i < rawData.length; i++) {
                var memberRow = rawData[i].member;
                delete memberRow['id'];
                delete memberRow['clubs'];
                data.push(rawData[i].member);
              }
              var replacer = (key, value) => value === null ? '' : value
              var header = Object.keys(data[0])
              var csv = data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
              csv.unshift(header.join(','))
              csv = csv.join('\r\n')

              this.setState({
                members: json.results,
                membersCSV: csv
              });
            } else {
                this.setState({
                  members: [],
                  membersCSV: null
                });
              }
          }
        });
    }
  }

  fetchMetricsData() {
    if (this.state.logged_in) {
      // obtain benchmarking metrics for current club
      fetch(this.address + '/metrics/', {
        headers: {
          Authorization: `Bearer ${this.retrieveTokens().access}`
        }
      })
        .then(res => res.json())
        .then(json => {
          // store metrics for current club
          if (typeof json !== 'undefined') {
            this.setState({
              metrics: json
            });
          }
        });
    }
  }

  componentDidMount() {
    this.fetchUserData();
    this.fetchMemberData();
    this.fetchMetricsData();
  }

  handleDelete = (e, m_id, m_first_name) => {
    e.preventDefault();
    fetch(this.address + '/members/' + m_id, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.retrieveTokens().access}`,
        'Content-Type': 'application/json'
      },
    })
      .then(res => res.json())
      .then(json => {
        this.fetchMetricsData();
        this.fetchMemberData();
        this.setState({
          deletedMember: m_first_name
        })
      });
  };

  handleLogout = () => {
    this.clearTokens();

    this.setState({
      logged_in: false,
      username: '',
      club_name: '',
      members: []
    });
  };

  render() {
    if (!this.state.logged_in) {
      this.props.history.push('/login');
    }

    return (
      <div className="App">
        <AppNav
          logged_in={this.state.logged_in}
          csvData={this.state.membersCSV}
          handleLogout={this.handleLogout}
        />

        <br /><br />

        <p className="page-header"><b>{this.state.club_name}</b></p>

        <br />
        
        {this.state.deletedMember != null &&
          <div className="container">
            <Alert variant={'success'}>
              {this.state.deletedMember} has been removed from the list.
            </Alert>
          </div>
        }

        <br />

        {this.state.metrics !== null &&
          <div className="container">
            <div className="row">
              <div className="col-sm">
                <MetricsCard
                    title={"Club Size"}
                    units={"members"}
                    singularUnit={"member"}
                    clubMetric={this.state.metrics.clubMembers}
                    averageMetric={this.state.metrics.averageMembers} />
              </div>
              <div className="col-sm">
                <MetricsCard
                  title={"Club Diversity"}
                  units={"unique majors"}
                  singularUnit={"unique major"}
                  clubMetric={this.state.metrics.clubMajors}
                  averageMetric={this.state.metrics.averageMajors} />
              </div>
              <div className="col-sm">
                <MetricsCard
                    title={"Club Youth"}
                    units={"years remaining"}
                    singularUnit={"year remaining"}
                    clubMetric={this.state.metrics.clubYears}
                    averageMetric={this.state.metrics.averageYears} />
              </div>
            </div>
          </div>
        }

        <br /><br />

        <div className="container">
          <Card>
            <Table striped
                   responsive
                   style={{marginBottom: "0px"}}>
              <thead>
                <tr>
                  <th>Andrew ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Primary Major</th>
                  <th>Graduation Year</th>
                  <th>Date Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {this.state.members.map((m) => {
                  return (
                    <tr key={"row-" + m.member.andrew_id}>
                      <td key={m.member.andrew_id}>{m.member.andrew_id}</td>
                      <td key={m.member.andrew_id + "-" + m.member.first_name}>{m.member.first_name}</td>
                      <td key={m.member.andrew_id + "-" + m.member.last_name}>{m.member.last_name}</td>
                      <td key={m.member.andrew_id + "-" + m.member.primary_major}>{m.member.primary_major}</td>
                      <td key={m.member.andrew_id + "-" + m.member.graduation_year}>{m.member.graduation_year}</td>
                      <td key={m.member.andrew_id + "-" + m.member.created_at}><Moment format="MMMM D">{m.member.created_at}</Moment></td>
                      <td key={m.member.andrew_id + "-actions"}>
                        <a href={"mailto:" + m.member.andrew_id + "@andrew.cmu.edu"} className="btn btn-primary btn-sm">Email</a>
                        &nbsp;&nbsp;
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={e => this.handleDelete(e, m.member.id, m.member.first_name)}>
                            Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        </div>

        <br /><br />
      </div>
    );
  }
}

export default App;
