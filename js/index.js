var intervalo;
var indiceLugar = 0;
var dataJuego;
var map;
var lugar= {properties:{"media": {"Name":""}}};
var dataFlickr = {items:[{"media": {"m":"imagenes/start.jpg"}}]};
var popup = L.popup();
var coordClick;
var indiceFoto=0;
var numFoto=0;
var otroJuego = false;

jQuery(document).ready(function() { 
    var dificultad;
    $("#reglas").hide();
    $("#botonReglas").click(function(){
        $("#reglas").fadeIn();
    })
    $("#cerrarReglas").click(function(){
        $("#reglas").hide();
    })
    $("#abortarJuego").hide();
    map = L.map('map');
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    map.setView([40.2839, -3.8215], 2);
    $("#elegirPunto").click(function(){
        if(coordClick){
            clearInterval(intervalo);
            console.log("se ha parado el intervalo")
            var dist = calcularDist(coordClick.lat,coordClick.lng,lugar.geometry.coordinates[1],lugar.geometry.coordinates[0]);
            console.log("distancia:" + dist);
            calcularPuntos(dist); 
            $("#distancia").html("Distancia: " + dist + " km");
            $("#distancia").show();         
            coordClick = undefined;
            indiceLugar++;
            if(indiceLugar<dataJuego.features.length){
                intervalo = setInterval(function () {jugar(dataJuego.features)}, 3000/dificultad);
            }else{
                $("#abortarJuego").hide();
                $("#jugar").fadeIn();
                placeLayer = L.geoJson(dataJuego, {
		        onEachFeature: popUpName
	            }).addTo(map);
                indiceLugar = 0;
            }  
        }else{
            alert("tienes que elegir un punto en el mapa!");
        }
    });
    $("#abortarJuego").click(function(){
        clearInterval(intervalo);
        $("#abortarJuego").hide();
        $("#jugar").fadeIn();     
        indiceFoto=0;
        numFoto=0;
        otroJuego = false;
        mostrarFotos ({"media": {"m":"imagenes/start.jpg"}});
        $("#puntos").html("0");
        $("#distancia").hide();
    });
    $("#jugar").click(function(){
        var juego = $('input[name="radio"]:checked', '.funkyradio').val();
        if(otroJuego){
            map.removeLayer(placeLayer);
            $("#puntos").html("0");
            $("#distancia").hide();
        }
        if(juego){
            $("#jugar").hide();
            $("#abortarJuego").fadeIn();
            cogerInfoFichero(juego);
            dificultad = $("#numDificultad").val();
            intervalo = setInterval(function () {jugar(dataJuego.features);}, 3000/dificultad);
            otroJuego = true; 
        }else{
            alert("Debes elegir un juego al que jugar");
        } 
    });
    map.on('click', onMapClick);
});

function cogerInfoFichero(fichero){
    $.getJSON(fichero, function(data) {
        dataJuego = data;
	});
}

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("Has hecho click en el mapa en " + e.latlng.toString())
        .openOn(map);
    coordClick = e.latlng;
    console.log(coordClick);
    console.log(lugar);
}


//función para calcular distancia entre puntos en un mapa con coordenadas http://www.mapanet.eu/Resources/Script-Distance.htm
function calcularDist(lat1, lon1, lat2, lon2)
  {
  rad = function(x) {return x*Math.PI/180;}
  var R     = 6378.137;                          //Radio de la tierra en km
  var dLat  = rad( lat2 - lat1 );
  var dLong = rad( lon2 - lon1 );
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLong/2) * Math.sin(dLong/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d.toFixed(3);                      //Retorna tres decimales
}

function calcularPuntos(dist){
    var antes = $("#puntos").html();
    var ahora = Math.floor(parseFloat(antes) + (parseFloat(dist) * numFoto) );
    $("#puntos").html(ahora);
}




function popUpName(feature, layer) {
	// does this feature have a property named popupContent?
	if (feature.properties && feature.properties.Name) {
        //layer.bindPopup(feature.properties.Name);
    }
}

function jugar(features){
    //Compruebo que el lugar que he buscado como etiqueta en flickr anteriormente es el mismo para no volver a realizar la busqueda
    console.log("features!!!: " + features);
    if(lugar.properties.Name != features[indiceLugar].properties.Name){
        console.log("busco en flickr: " + features[indiceLugar].properties.Name);
        lugar = features[indiceLugar];
        indiceFoto = 0;
        numFoto = 0;
        cogerInfoFlickr(features);
    }else{
        if(indiceFoto == dataFlickr.items.length){
            indiceFoto = 0;
        }
        mostrarFotos(dataFlickr.items[indiceFoto]);
        console.log(indiceFoto)
        indiceFoto++;
        numFoto++;
    }
}

function cogerInfoFlickr(features){
    var flickrAPI = "http://api.flickr.com/services/feeds/photos_public.gne?tagmode=any&format=json&jsoncallback=?";
        $.getJSON(flickrAPI, {tags: features[indiceLugar].properties.Name})
        .done(function( data ) {
            dataFlickr = data;
            console.log("MOSTRANDO FOTOS CON LA ETIQUETA: " + features[indiceLugar].properties.Name);
            mostrarFotos(data.items[indiceFoto]);
            console.log(indiceFoto)
            indiceFoto++;
            numFoto++;
        });
}

function mostrarFotos (item){
    var img = document.getElementById("imagenFLICKR");
    img.src = item.media.m; 
} 

