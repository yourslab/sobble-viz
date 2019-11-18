import React, { Component } from 'react';
import {
  Button, InputGroup, Form, Row, FormControl, Tabs, Tab, Col
} from 'react-bootstrap';
import {AsyncTypeahead} from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import axios from 'axios';
import update from 'react-addons-update';
import logo from './assets/r3_nice.png';
import { EV_ICON, START_ICON, END_ICON} from './Icons.jsx';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedIn: false,
      firstName: '',
      lastName: '',
      origins: [],
      isLoading: false
    };
  }

  onChange = (event) => this.setState({ [event.target.name]: event.target.value });

  handleLogin = (e) => {
    e.preventDefault();
    this.setState((prevState) => ({ loggedIn: !prevState.loggedIn}));
  }

  _handleSearch = (query, param) => {
    this.setState({isLoading: true});
    // Geocode address using HERE API
    const endpoint = 'http://autocomplete.geocoder.api.here.com/6.2/suggest.json?app_id=yYmThWqWR9AHibbANJef&app_code=NRSvJeiKL5h90LqJQ8Ugww&query='+query;
    axios.get(endpoint)
      .then((response) => {
        this.setState({
          isLoading: false,
          [param]: response.data.suggestions.map((result) => ({
            ...result,
            label: result.label.split(", ").reverse().join(", ")
          })),
        });
      })
      .catch((error) => {
        console.log(error);
        this.setState({
          isLoading: false,
          [param]: [],
        });
      })
    }

  _handleSelect = (selection, icon) => {
    // Get lat-long from HERE API
    const endpoint = 'https://geocoder.api.here.com/6.2/geocode.json?app_id=yYmThWqWR9AHibbANJef&app_code=NRSvJeiKL5h90LqJQ8Ugww&locationID='+selection[0].locationId
    axios.get(endpoint)
      .then((response) => {
        const coords = response.data.Response.View[0].Result[0].Location.DisplayPosition;
        if (coords) {
          const lat = coords.Latitude;
          const long = coords.Longitude;
          console.log(lat, long);
          // Set pin from parent method
          this.props.setPin(lat, long, icon);
        }
      })
      .catch((error) => {
        console.log(error);
      })
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
      <Tab eventKey="home" title="Cargo" style={{paddingTop: 20, width: '19em'}}>
        <Form.Group controlId="formBasicWeight">
        <InputGroup className="mb-3">
          <Form.Control type="weight" placeholder="Weight" />
          <InputGroup.Append>
      <InputGroup.Text>kg</InputGroup.Text>
    </InputGroup.Append>
        </InputGroup>
        </Form.Group>
        <Form.Group controlId="formBasicHeight">
        <InputGroup className="mb-3">
          <Form.Control type="height" placeholder="Height" />
          <InputGroup.Append>
      <InputGroup.Text>cm</InputGroup.Text>
    </InputGroup.Append>
    </InputGroup>
        </Form.Group>
        <Form.Group controlId="formBasicHeight">
          <InputGroup className="mb-3">
          <Form.Control type="charge" placeholder="Charge" />
          <InputGroup.Append>
      <InputGroup.Text> %</InputGroup.Text>
    </InputGroup.Append>
    </InputGroup>
        </Form.Group>
      </Tab>
      <Tab eventKey="profile" title="Rest" style={{paddingTop: 20, width: '19em'}}>
  <Form.Group>
  <label htmlFor="break-time">Time since last break (30 mins)</label>
  <InputGroup className="mb-3" size="sm">
  <InputGroup.Prepend>
      <InputGroup.Text>Hour</InputGroup.Text>
    </InputGroup.Prepend>
    <FormControl aria-label="hour" />
    <InputGroup.Prepend>
      <InputGroup.Text>Minute</InputGroup.Text>
    </InputGroup.Prepend>
    <FormControl id="break-time" aria-label="Time since last break" />
  </InputGroup>
  </Form.Group>
  <Form.Group>
  <label htmlFor="rest-time">Time since last rest (10 hrs)</label>
  <InputGroup className="mb-3" size="sm">
  <InputGroup.Prepend>
      <InputGroup.Text>Hour</InputGroup.Text>
    </InputGroup.Prepend>
    <FormControl aria-label="hour" />
    <InputGroup.Prepend>
      <InputGroup.Text>Minute</InputGroup.Text>
    </InputGroup.Prepend>
    <FormControl id="rest-time" aria-label="Time since last rest" />
  </InputGroup>
  </Form.Group>
      </Tab>
    </Tabs>
          <Form.Group controlId="formBasicOrigin">
            <AsyncTypeahead
              allowNew={false}
              isLoading={this.state.isLoading}
              labelKey="label"
              id="origin"
              onSearch={(query) => this._handleSearch(query, 'origins')}
              onChange={(selected) => {
                // Handle selections...
                this._handleSelect(selected, START_ICON);
              }}
              options={this.state.origins}
              placeholder="Origin"
            />
          </Form.Group>

          <Form.Group controlId="formBasicDestination">
            <AsyncTypeahead
              allowNew={false}
              isLoading={this.state.isLoading}
              labelKey="label"
              id="destination"
              onSearch={(query) => this._handleSearch(query, 'destinations')}
              onChange={(selected) => {
                // Handle selections...
                this._handleSelect(selected, END_ICON);
              }}
              options={this.state.destinations}
              placeholder="Destination"
            />
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
