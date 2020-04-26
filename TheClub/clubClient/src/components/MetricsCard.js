import React from 'react';
import PropTypes from 'prop-types';
import '../stylesheets/App.css';
import { Card } from 'react-bootstrap';

class MetricsCard extends React.Component {
  render() {
    return (
      <React.Fragment>
        <Card className="metrics-card">
            <div className="card-body">
                <h6 className="card-title">{this.props.title}</h6>
                <div className="card-text">
                <h1 className="metrics-card-metric">{this.props.clubMetric}</h1>
                &nbsp;{this.props.clubMetric === 1 ? this.props.singularUnit : this.props.units}
                <hr />
                University Average:
                <span style={{color: "#fff"}}>&nbsp;{this.props.averageMetric}</span>
                {this.props.averageMetric > this.props.clubMetric &&
                    <i className="material-icons" style={{color: "#dc3545"}}>arrow_drop_down</i>
                }
                {this.props.averageMetric < this.props.clubMetric &&
                    <i className="material-icons" style={{color: "green"}}>arrow_drop_up</i>
                }
                </div>
            </div>
        </Card>
      </React.Fragment>
    );
  }
}

export default MetricsCard;

MetricsCard.propTypes = {
  title: PropTypes.string.isRequired,
  units: PropTypes.string.isRequired,
  singularUnit: PropTypes.string.isRequired,
  clubMetric: PropTypes.number.isRequired,
  averageMetric: PropTypes.number.isRequired
};
