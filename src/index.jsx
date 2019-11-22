import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import DeckGL from '@deck.gl/react';
import update from 'react-addons-update';
import { ScenegraphLayer } from '@deck.gl/mesh-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { IconLayer } from '@deck.gl/layers';
import {
  Popover
} from 'react-bootstrap';
import axios from 'axios';
import { EditableGeoJsonLayer } from '@nebula.gl/layers';
import { GLTFScenegraphLoader } from '@luma.gl/addons';
import { registerLoaders } from '@loaders.gl/core';
import ReactMapGL, { Layer, StaticMap, HTMLOverlay } from 'react-map-gl';
import { congData1, congData2, congData3 } from './data/cong_map.js';
import App from './App.jsx';
import {EV_ICON, START_ICON, END_ICON} from './Icons.jsx';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// ScenegraphLayer will automatically pick the right
// loader for the file type from the registered loaders.
//registerLoaders([GLTFScenegraphLoader]);

// Change this to your model
//const GLTF_URL = 'https://raw.githubusercontent.com/yourslab/sobble-assets/master/car/scene.gltf';

// Change this to your access token
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZ2Vvcmdpb3MtdWJlciIsImEiOiJjanZidTZzczAwajMxNGVwOGZrd2E5NG90In0.gdsRu_UeU_uPi9IulBruXA';

const initialViewState = {
  latitude: 34.07306,
  longitude: -118.2192,
  zoom: 14,
  pitch: 60,
  bearing: 270
};

const buildingLayer = {
  id: '3d-buildings',
  source: 'composite',
  'source-layer': 'building',
  filter: ['==', 'extrude', 'true'],
  type: 'fill-extrusion',
  minzoom: 1,
  paint: {
    'fill-extrusion-color': '#aaa',

    // use an 'interpolate' expression to add a smooth transition effect to the
    // buildings as the user zooms in
    'fill-extrusion-height': [
      'interpolate', ['linear'], ['zoom'],
      5, 0,
      5.05, ['get', 'height'],
    ],
    'fill-extrusion-base': [
      'interpolate', ['linear'], ['zoom'],
      5, 0,
      5.05, ['get', 'min_height'],
    ],
    'fill-extrusion-opacity': 0.6,
  },
};

class DeckWithMaps extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewState: initialViewState,
      time: 0,
      poi: [],
      originIdx: null,
      destIdx: null,
      routes: [],
      geojson: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [-122.469492, 37.80182],
            },
          },
        ],
      },
    };
  }

  _onViewStateChange = ({viewState}) => {
    this.setState({viewState});
  };

  _panToLatLong = (lat, long) => {
    this.setState({
      viewState: {
        ...this.state.viewState,
        longitude: long,
        latitude: lat,
        bearing: 0
      }
    });
  }

  _showPath = (startCoord, endCoord, battCharge, battCap, truckHeight, truckWeight) => {
    if(startCoord.length && endCoord.length) {
      //let endpoint = `https://qq2tb7ic1g.execute-api.us-west-1.amazonaws.com/Hackathon/trace-route?waypoint0=${startCoord[0]},${startCoord[1]}&waypoint1=${endCoord[0]},${endCoord[1]}&weight=${truckWeight}&height=${truckHeight}&battery_capacity=${battCap}&soc=${battCharge}`
      let endpoint = `https://qq2tb7ic1g.execute-api.us-west-1.amazonaws.com/Hackathon/trace-route?waypoint0=${startCoord[0]},${startCoord[1]}&waypoint1=${endCoord[0]},${endCoord[1]}&weight=0&height=0&battery_capacity=800000&soc=648000`
      axios.get(endpoint)
      .then((response) => {
        this.setState({
          poi: response.data.stops.map((poi, idx, arr) => {
            let icon = null;
            let color = null;
            if (idx == 0) {
              icon = START_ICON;
              color = [234, 67, 53];
              this._panToLatLong(parseFloat(poi[0]), parseFloat(poi[1]));
            } else if (idx == arr.length-1) {
              icon = END_ICON;
              color = [234, 67, 53];
            } else {
              icon = EV_ICON;
              color = [0, 0, 0];
            }

            return {coordinates: poi.slice(0, 2).reverse().map((coord) => parseFloat(coord)), restTime: poi[2], type: icon, color: color};
          }),
          routes: [{waypoints: response.data.shapes.map((coord) => ({timestamp: 0, coordinates: coord[0].split(',').reverse().map((x) => parseFloat(x))}))}]
        });
      })
      .catch((error) => {
        console.log(error);
      })
    }
  }

  _handleContextMenu = (event) => {
    event.preventDefault();
  };

  componentDidMount() {
    //this.plantPin(this.state.routes[0].waypoints[0].coordinates[1], this.state.routes[0].waypoints[0].coordinates[0], START_ICON);
    //this.plantPin(this.state.routes[0].waypoints[this.state.routes[0].waypoints.length - 1].coordinates[1], this.state.routes[0].waypoints[this.state.routes[0].waypoints.length - 1].coordinates[0], END_ICON);
    document.addEventListener('contextmenu', this._handleContextMenu);
    /*this.interval = setInterval(() => {
      this.setState((prevState) => ({ time: prevState.time + 1 }));
    }, 100);*/
  }

  componentWillUnmount() {
    document.removeEventListener('contextmenu', this._handleContextMenu);
    //clearInterval(this.interval);
  }

  waitingTime(lat) {
    if(lat >= 39.52734) {
      return 'Rest for 30 minutes';
    } else if(lat <= 41.54872) {
      return 'Rest for 10 hours';
    } else {
      return 'Rest for 10 hours';
    }
  }

  _renderTooltip() {
    const { hoveredObject, pointerX, pointerY } = this.state || {};
    return hoveredObject && (
      <Popover id="poi-popover" placement="right" style={{left: pointerX,top: pointerY}}>
        <Popover.Title as="h3">Charging Station</Popover.Title>
        <Popover.Content>
          Lat: <i>{hoveredObject.coordinates[1]}</i>, Long: <i>{hoveredObject.coordinates[0]}</i><br />
          {this.waitingTime(hoveredObject.coordinates[1])}
        </Popover.Content>
      </Popover>
    );
  }

  _unplantPin = (icon) => {
    /*if(icon == START_ICON && this.state.originIdx) {
      this.setState((prevState) => ({
        poi: prevState.poi.filter((value, index, arr) => index != prevState.originIdx),
        originIdx: null
      }));
    } else if(icon == END_ICON && this.state.destIdx) {
      this.setState((prevState) => ({
        poi: prevState.poi.filter((value, index, arr) => index != prevState.destIdx),
        destIdx: null
      }));
    }*/
  }

  plantPin = (lat, long, icon) => {
    let color = [0, 0, 0];
    if(icon == START_ICON || icon == END_ICON) color = [234, 67, 53];
    this.setState((prevState) => ({
      poi: [...prevState.poi, {coordinates: [long, lat], type: icon, color: color }]
    }));
    if(icon == START_ICON) {
      this._panToLatLong(lat, long);
    }
  }

  makePreferred = (info) => {
    const idx = info.index;
    this.setState({
      poi: update(this.state.poi, { [idx]: { color: { $set: [255, 0, 0] } } }),
    });
  }

  render() {
    const {
      geojson, poi, routes, time, viewState
    } = this.state;
    // This layer provides the editable functionality
    const editableLayer = new EditableGeoJsonLayer({
      id: 'geojson',
      data: geojson,
      mode: 'drawPoint',
      onEdit: ({ updatedData }) => {
        this.setState({ geojson: updatedData });
      },
    });

    const basicIconLayer = new IconLayer({
      id: 'icon-layer',
      data: poi,
      pickable: true,
      // iconAtlas and iconMapping are required
      // getIcon: return a string,
      alphaCutoff: 0,
      autoHighlight: true,
      getIcon: (d) => d.type.marker,
      sizeScale: 15,
      getPosition: (d) => d.coordinates,
      getSize: (d) => 5,
      getColor: (d) => d.color,
      onHover: (info) => this.setState({
        hoveredObject: info.object,
        pointerX: info.x,
        pointerY: info.y,
      }),
      onClick: (info) => this.makePreferred(info),
    });

    const tripsLayer = new TripsLayer({
      id: 'trips-layer',
      data: routes,
      getPath: (d) => d.waypoints.map((p) => p.coordinates),
      // deduct start timestamp from each data point to avoid overflow
      getTimestamps: (d) => d.waypoints.map((p) => p.timestamp - 1554772579000),
      getColor: [22, 32, 230],
      opacity: 0.8,
      widthMinPixels: 5,
      rounded: true,
      trailLength: 200,
      currentTime: 10,
    });


    // This layer renders the glTF objects
    /*const scenegraphLayer = new ScenegraphLayer({
      id: 'scene',
      scenegraph: GLTF_URL,
      data: geojson.features,
      getPosition: (f) => f.geometry.coordinates,
      sizeScale: 0.1,
      getOrientation: [0, 0, 0],
      getTranslation: [0, 0, 0],
      getScale: [1, 1, 1],
    });*/

    return (
      <div>
      <DeckGL
        viewState={viewState}
        onViewStateChange={this._onViewStateChange}
        controller
        layers={[tripsLayer, basicIconLayer]}
        getCursor={() => 'cell'}
      >
          <App/>
        <ReactMapGL mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}>
          <Layer {...buildingLayer} />
          { this._renderTooltip() }
        </ReactMapGL>
      </DeckGL>
      <App setPin={this.plantPin} unsetPin={this._unplantPin} showPath={this._showPath} />
      </div>
    );
  }
}

export default DeckWithMaps;
ReactDOM.render(<DeckWithMaps onContextMenu={(e)=> e.preventDefault()}/>, document.getElementById('root'));
