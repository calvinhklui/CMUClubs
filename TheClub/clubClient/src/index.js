import React from 'react';
import ReactDOM from 'react-dom';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom'

import App from './pages/App';
import Login from './pages/Login';
import Recruit from './pages/Recruit';
import NotFound from './components/NotFound';
import Bootstrap from 'bootstrap/dist/css/bootstrap.css'
import './stylesheets/index.css';

const routes = (
  <Router>
    <Switch>
      <Route exact path="/" component={App} />
      <Route path="/login" component={Login} />
      <Route path="/recruit" component={Recruit} />
      <Route component={NotFound} />
    </Switch>
  </Router>
)

ReactDOM.render(routes, document.getElementById('root'));
