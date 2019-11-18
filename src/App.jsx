import React, { Component } from 'react';
import {
  Button, InputGroup, Form, Row, FormControl, Tabs, Tab
} from 'react-bootstrap';
import update from 'react-addons-update';
import logo from './assets/r3_nice.png';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedIn: false,
      firstName: '',
      lastName: ''
    };
  }

  onChange = (event) => this.setState({ [event.target.name]: event.target.value });

  handleLogin = (e) => {
    e.preventDefault();
    this.setState((prevState) => ({ loggedIn: !prevState.loggedIn}));
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
        </div>
        <Form onSubmit={this.handleLogin} className="App-login" style={{ display: this.state.loggedIn ? 'none' : 'block' }}>
          <Form.Label style={{fontWeight: 'bold'}}>Driver Information</Form.Label>
          <Form.Group>
            <Form.Control type="fname" placeholder="First Name" name="firstName" value={this.state.firstName} onChange={this.onChange} />
          </Form.Group>

          <Form.Group>
            <Form.Control type="lname" placeholder="Last Name" name="lastName" value={this.state.lastName} onChange={this.onChange} />
          </Form.Group>
          <Button variant="primary" type="submit" active>
    Login
          </Button>
        </Form>
        <div className="App-route" style={{ display: !this.state.loggedIn ? 'none' : 'block' }}>
        <Form.Label style={{fontWeight: 'bold'}}>Hi {this.state.firstName}{this.state.lastName ? ' ' + this.state.lastName : this.state.lastName}! Plan your route.</Form.Label>
                  <Tabs id="controlled-tab-example">
      <Tab eventKey="home" title="Cargo" style={{paddingTop: 20}}>
        <Form.Group controlId="formBasicWeight">
          <Form.Control type="weight" placeholder="Weight" />
        </Form.Group>
        <Form.Group controlId="formBasicHeight">
          <Form.Control type="height" placeholder="Height" />
        </Form.Group>
        <Form.Group controlId="formBasicHeight">
          <Form.Control type="charge" placeholder="Charge" />
        </Form.Group>
      </Tab>
      <Tab eventKey="profile" title="Rest" style={{paddingTop: 20}}>
        <Form.Group controlId="formBasicWeight">
          <Form.Control type="weight" placeholder="Weight" />
        </Form.Group>
        <Form.Group controlId="formBasicHeight">
          <Form.Control type="height" placeholder="Height" />
        </Form.Group>
        <Form.Group controlId="formBasicHeight">
          <Form.Control type="charge" placeholder="Charge" />
        </Form.Group>
      </Tab>
    </Tabs>
          <Form.Group controlId="formBasicEmail">
            <Form.Control type="fname" placeholder="Origin" />
          </Form.Group>

          <Form.Group controlId="formBasicPassword">
            <Form.Control type="lname" placeholder="Destination" />
          </Form.Group>

          <Button variant="primary" type="submit">
    Route
          </Button>
        </div>
      </div>
    );
  }
}

export default App;
