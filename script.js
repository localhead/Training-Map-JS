'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// parent class
class Workout {
  date = new Date();
  // Do not forget to use Libs to create unique ID's for classes
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [latitude , longitude]
    this.distance = distance; // in km
    this.duration = duration; // in minutes
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

// child class
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence; // steps per minute
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// child class
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const runTest1 = new Running([55.7685807, 49.1881459], 5.2, 24, 178);
console.log(runTest1);
/* 




*/
// Application architecture
class App {
  /* Adding private variables (properties not vars!) for all the instances created from this class*/
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    /* getting global position right from the begining */
    this._getPosition();
    form.addEventListener('submit', this._newWorkOut.bind(this));
    inputType.addEventListener('change', this._toggleElevationFiled.bind(this));
  }

  _getPosition() {
    // Geolocation is browser API that gets 2 args. First will be called on success.
    // second one will be called on error of getting of coordinats
    // But before using this API lets check if browser has this feature
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        /* we use bind in order to show laodMap method where his this is */
        this._loadMap.bind(this),
        function () {
          alert('Could not get you position');
        }
      );
    }
  }

  /* This function will be triggered if geolocation is successfull */
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(latitude, longitude);

    const coords = [latitude, longitude];

    /* leaflet lib */
    this.#map = L.map('map').setView(coords, 13);
    /* 
    map is a special variable which comes with leaflet lib
    it has some methods which allows us to use this lib
    */

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    /* We call map's "on" method  */
    /* Allowing to put markers on click on screen */
    // Handlings clicks on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    /* Showing form for user inputs */
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationFiled() {
    // selecting closest parent with "closest"
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkOut(event) {
    event.preventDefault();

    // (...inputs) is array here
    const validInputs = (...inputs) =>
      // (every) loops over the array and will return true if every inp is true
      inputs.every(inp => Number.isFinite(inp));

    const positiveNumber = (...inputs) =>
      // (every) loops over the array and will return true if every inp is true
      inputs.every(inp => inp > 0);

    // get data from form
    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = +inputDuration.value;

    /* lets take out coords from this obj. We extract coord from a place where user clicked*/
    const { lat, lng } = this.#mapEvent.latlng;
    // array where we will store 1 workout
    let workout;

    // if running - create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if data is valid
      console.log(validInputs(distance, duration, cadence));
      console.log(positiveNumber(distance, duration, cadence));
      if (
        !validInputs(distance, duration, cadence) ||
        !positiveNumber(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers');
      }

      // creating running obj
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    if (type === 'cycling') {
      // check if data is valid
      const elevation = +inputElevation.value;
      // check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !positiveNumber(distance, duration)
      )
        return alert('Inputs have to be positive numbers');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // add that workout to global array workouts
    this.#workouts.push(workout);

    console.log(workout);
    // render workout on map as marker

    // Display marker
    // we can see the coords and other stuff on this event
    console.log(this.#mapEvent);

    // Clearing fields after submit
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    this._renderWorkoutMarker(workout);

    // rendering list of workouts
    this._renderWorkout(workout);

    this._hideForm();
  }

  _renderWorkoutMarker(workout) {
    /* We add some extra props on popup, which you can find in documetation to lib */
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    console.log('aaaaa');
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'cycling' ? '🚴‍♀️' : '🏃‍♂️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain.toFixed(
            1
          )}</span>
          <span class="workout__unit">m</span>
        </div>
        `;

    form.insertAdjacentHTML('afterend', html);
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
}

const app = new App();

// Selecting cycling or running
// if we select running we must show Cadence, if we do cycling we show Elevation
