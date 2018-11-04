//TODO replace profile-coordinates with coordinates calculated from address
//TODO replace confirm-alert for geolocation with eventlistener on button

//BUG Zoom level or radius varies

//localStorage.removeItem('coords');
//localStorage.removeItem('fetched-profiles');

//Swipe Code
const profileCard = document.querySelector('.container');
const hammer = new Hammer(profileCard);

hammer.on('swipeleft', function(ev){
    ClassifyProfile('like');
});

hammer.on('swiperight', function(ev){
    ClassifyProfile('dislike');
});
    
//Fetch profiles from api
function fetchData() {
    //HTML5 Fetch
    fetch('https://randomuser.me/api?results=10')
        .then(function (response) {
            return response.json();
        })
        .then(function (myJson) {
            localStorage.setItem('fetched-profiles', JSON.stringify(myJson));
            validateFetch();
        })



}

//Initialize Map
mapboxgl.accessToken = 'pk.eyJ1IjoiYXJ2ZWxsb24iLCJhIjoiY2puNG1zdWd4M2kzdjNrcXlleGtpazI2cCJ9.p7i1IOVRm40GP4qdK4JuGg';
let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9'
});

//Check is clientlocation is known and otherwise prompt request
if (localStorage.getItem('clientLon') == undefined || localStorage.getItem('clientLat') == undefined) {
    if (confirm('May we determine your location to calculate distance with other profiles?')) {
        getClientPosition();
    }
}

function getClientPosition() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function (pos) {
            let coordLon = pos.coords.longitude;
            let coordLat = pos.coords.latitude;
            console.log('var coordLon ' + coordLon);
            console.log('var coordLat ' + coordLat);
            localStorage.setItem('clientLon', coordLon);
            localStorage.setItem('clientLat', coordLat);
            console.log('LS Lon' + localStorage.getItem('clientLon'));
            console.log('LS Lat' + localStorage.getItem('clientLat'));
        });
    } else {
        console.log("Geolocation request denied or not available");
    }
}

function validateFetch() {
    let fetchedArray = JSON.parse(localStorage.getItem('fetched-profiles'));
    let likeArray = JSON.parse(localStorage.getItem('likes'));
    let dislikeArray = JSON.parse(localStorage.getItem('dislikes'));
    let clear = true;
    for (let i = 0; i < fetchedArray.length; i++) {
        if (likeArray.includes(fetchedArray.results[i].login.uuid) || dislikeArray.includes(fetchedArray.results[i].login.uuid)) {
            break;
            clear = false;
            console.log('duplicate found');
            localStorage.removeItem('fetched-profiles');
            fetchData();

        }
    }
    if (clear) {
        nextProfile();
        DisplayLikesDislikes(true);
    }
}

document.querySelector('.close-map').addEventListener('click', function(){
    document.querySelector('.close-map').style.opacity = 0;
    document.querySelector('.map').classList.remove('map-visible');

});

let index = 0;
let currentProfile = '';
let displayLDindex = 0;

function nextProfile() {
    //De-stringify array from localStorage
    let array = JSON.parse(localStorage.getItem('fetched-profiles'));
    //store profile from array with current $index in $currentprofile
    currentProfile = array.results[index];
    displayProfile(currentProfile);
    //Update $index and re-execute fetchData() if>=9
    if (index >= 9) {
        index = 0;
        fetchData();
    } else {
        index++;
    }
}

function displayProfile(hooman) {
    //Generating elements
    document.querySelector('.data-container').innerHTML = '';
    document.querySelector('.data-container').innerHTML += '<h2 class="profile-name">' + hooman.name.first + ' ' + hooman.name.last + '</h2>';
    document.querySelector('.data-container').innerHTML += '<div class="picture"></div>';
    document.querySelector('.picture').style.backgroundImage = 'url(' + hooman.picture.large + ')';
    document.querySelector('.data-container').innerHTML += '<h3 class="profile-spec">Age</h3><p>' + hooman.dob.age + '</p>';
    document.querySelector('.data-container').innerHTML += '<h3 class="profile-spec">Address</h3><p>' + hooman.location.street + ', ' + hooman.location.city + '</p>';
    let targetLat = hooman.location.coordinates.latitude;
    let targetLon = hooman.location.coordinates.longitude;
    let clientLat = localStorage.getItem('clientLat');
    let clientLon = localStorage.getItem('clientLon');
    document.querySelector('.data-container').innerHTML += '<h3 class="profile-spec">Distance</h3>';
    document.querySelector('.data-container').innerHTML += '<p>' + getDistance(clientLat, clientLon, targetLat, targetLon) + '</p>';
    document.querySelector('.data-container').innerHTML += '<button class="show-on-map">Show on map</button>';
    document.querySelector('.show-on-map').addEventListener('click', function () {
        addProfileToMap(targetLon, targetLat);
    });
}

function ClassifyProfile(type) {
    if (type == 'like') {
        let likes = new Array();
        //De-stringifying liked profiles-array from localStorage except first like
        if (localStorage.getItem('likes') != null) {
            likes = JSON.parse(localStorage.getItem('likes'));
        }
        likes.push(currentProfile);
        //Stringifying and storing array $likes to localStorage
        localStorage.setItem('likes', JSON.stringify(likes));
        DisplayLikesDislikes();
        nextProfile();
    } else if (type == 'dislike') {
        let dislikes = new Array();
        //De-stringifying disliked profiles-array from localStorage except first dislike
        if (localStorage.getItem('dislikes') != null) {
            dislikes = JSON.parse(localStorage.getItem('dislikes'));
        }
        dislikes.push(currentProfile);
        //Stringifying and storing array $dislikes to localStorage
        localStorage.setItem('dislikes', JSON.stringify(dislikes));
        DisplayLikesDislikes();
        nextProfile();
    }
}

function DisplayLikesDislikes(init) {
    //Create $likes and set to de-stringified localstorage string likes
    let likes = JSON.parse(localStorage.getItem('likes'));
    //Loop through $likes and display
    document.querySelector('.likes-container').innerHTML = '';
    if (likes != null) {
        for (i = 0; i < likes.length; i++) {
            document.querySelector('.likes-container').innerHTML += '<h3 class="switchlist" id="l' + i + '">' + likes[i].name.first + ' ' + likes[i].name.last + '</h3>';
        }
        for (a = 0; a < likes.length; a++) {
            displayLDindex = a;
            document.querySelector('#l' + a).addEventListener('click', function () {
                SwitchList(event.target.getAttribute('id').substr(1), 'likes');
            });
        }
    }
    //Create $dislikes and set to de-stringified localstorage string likes
    let dislikes = JSON.parse(localStorage.getItem('dislikes'));
    //Loop through $dislikes and display
    document.querySelector('.dislikes-container').innerHTML = '';
    if (dislikes != null) {
        for (i = 0; i < dislikes.length; i++) {
            document.querySelector('.dislikes-container').innerHTML += '<h3 class="switchlist" id="d' + i + '">' + dislikes[i].name.first + ' ' + dislikes[i].name.last + '</h3>';
        }
        for (a = 0; a < dislikes.length; a++) {
            displayLDindex = a;
            document.querySelector('#d' + a).addEventListener('click', function () {
                SwitchList(event.target.getAttribute('id').substr(1), 'dislikes');
            });
        }
    }
}

function SwitchList(index, type) {
    let likes = JSON.parse(localStorage.getItem('likes'));
    let dislikes = JSON.parse(localStorage.getItem('dislikes'));
    console.log(index);
    console.log(likes[index]);
    if (type == 'likes') {
        dislikes.push(likes[index]);
        likes.splice(index, 1);
    } else {
        likes.push(dislikes[index]);
        dislikes.splice(index, 1);
    }
    localStorage.setItem('likes', JSON.stringify(likes));
    localStorage.setItem('dislikes', JSON.stringify(dislikes));
    DisplayLikesDislikes();
    addMarker();
}

fetchData();

function getDistance(clientLat, clientLon, targetLat, targetLon) {
    console.log(clientLat);
    console.log(clientLon);
    console.log(targetLat);
    console.log(targetLon);
    let radlat1 = Math.PI * clientLat / 180;
    let radlat2 = Math.PI * targetLat / 180;
    let theta = clientLon - targetLon;
    let radtheta = Math.PI * theta / 180;
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
        dist = 1;
    }
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    dist = dist * 1.609344;
    dist = Math.floor(dist) + 'km';
    return dist;
}

function metersToPixelsAtMaxZoom(meters, lat) {
    return meters / 0.075 / Math.cos(lat * Math.PI / 180);
}

function addProfileToMap(lon, lat) {
    //Scroll to top in case user scrolled down because otherwise the map isn't filling the window
    window.scrollTo(500, 0);
    //Make map and close-map icon visible
    document.querySelector('.map').classList.add('map-visible');
    document.querySelector('.close-map').style.opacity = 1;
    //Center on  target + zoom
    map.flyTo({
        center: [lon, lat],
        zoom: 9
    });
    //Add location circle
    map.addSource("geomarker", {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                }
        }]
        }
    });
    map.addLayer({
        "id": "geomarker",
        "type": "circle",
        "source": "geomarker",
        "paint": {
            "circle-radius": {
                stops: [
                    [0, 0],
                    [20, metersToPixelsAtMaxZoom(5000, lat)]
                  ],
                base: 2
            },
            "circle-color": "#3BBB87",
            "circle-opacity": 0.5
        }
    });
}