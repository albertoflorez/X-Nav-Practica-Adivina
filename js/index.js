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
var dificultad;
var paginaActual = 0;
var fromHistory = false;
//var fromHistoryAntes = false;
var numPaginas = 0;

jQuery(document).ready(function() { 
    $("#reglas").hide();
    $("#historyAlert").hide();
    $("#botonReglas").click(function(){
        $("#reglas").fadeIn();
    })
    $("#cerrarReglas").click(function(){
        $("#reglas").hide();
    })
    $("#botonHistory a").click(function(){
        $("#historyAlert").fadeIn();
    })
    $("#cerrarHistory").click(function(){
        $("#historyAlert").hide();
    })
    $("#abortarJuego").hide();
    $("#elegirPunto").hide();
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
                if(!fromHistory){
                    var str = (($('input[name="radio"]:checked', '.funkyradio').val()).split("/"))[1];
                    var nombreJuego = ((str).split("."))[0];
                    var puntos = $("#puntos").html();
                    var nivel = $("#numDificultad").val();
                    console.log("Elnombre del juego es!!!!: " + nombreJuego + " puntos: " + puntos + " en noviel: " + nivel);
                    actualizarHistory(nombreJuego,puntos,nivel);
                }
                alert("Has acabado el juego!")
                $("#changeDif").show();
                $("#nivel").hide();
                $("#abortarJuego").hide();
                $("#jugar").fadeIn();
                $(".inputPlaces").each(function(){$(this).attr('disabled',false);});
                $("#elegirPunto").hide();
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
        $(".inputPlaces").each(function(){$(this).attr('disabled',false);});
        $("#changeDif").show();
        $("#nivel").hide();
        $("#elegirPunto").hide();
        //fromHistory = fromHistoryAntes;//para poner si se viene de haber entrado en history y saber si se tiene que crear nueva entrada de history o no en la siguiente partida
    });
    $("#jugar").click(function(){
        //fromHistoryAntes = fromHistory;
        fromHistory = false;
        clickJugar();
    });
    map.on('click', onMapClick);
    window.addEventListener('popstate', function(event) {
        juegoHistorial(event.state);
    });
});

function clickJugar(){
    var juego = $('input[name="radio"]:checked', '.funkyradio').val();
    if(otroJuego){
        map.removeLayer(placeLayer);
        $("#puntos").html("0");
        $("#distancia").hide();
    }
    if(juego){
        $(".inputPlaces").each(function(){$(this).attr('disabled',true);});
        $("#jugar").hide();
        $("#abortarJuego").fadeIn();
        $("#nivel").show();
        $("#nivel").html($("#numDificultad").val());
        $("#changeDif").hide();
        $("#elegirPunto").fadeIn();
        cogerInfoFichero(juego);
        dificultad = $("#numDificultad").val();
        intervalo = setInterval(function () {jugar(dataJuego.features);}, 3000/dificultad);
        otroJuego = true; 
    }else{
        alert("Debes elegir un juego al que jugar");
    } 
}

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
        console.log("indice foto: " + indiceFoto)
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
            console.log("indice foto: " + indiceFoto)
            indiceFoto++;
            numFoto++;
        });
}

function mostrarFotos (item){
    var img = document.getElementById("imagenFLICKR");
    img.src = item.media.m; 
} 

function juegoHistorial(state){
    console.log("jugoHistorial!!!");
    if(state){
        switch(state.nombre) {
            case "capitales":
                document.getElementById("radio1").checked = true;
                break;
            case "islas":
                document.getElementById("radio2").checked = true;
                break;
            case "ciudades":
                document.getElementById("radio3").checked = true;
                break;
            default:
                document.getElementById("radio6").checked = true;
        }
        $("#numDificultad").val(state.level);
        clickJugar();
    }
}

function historyGo(pagina){
    $("#historyAlert").hide();
    var togo = pagina - paginaActual;
    console.log("togo es: " + togo);
    fromHistory = true;
    if(togo!=0){
        paginaActual = pagina;
        history.go(togo);
    }else{
        juegoHistorial(history.state);
    }
}

function actualizarHistory(nombreJuego,puntuacion,nivel){
    var stateObj={nombre: nombreJuego,
            fecha: new Date(),
            puntos:puntuacion,
            level:nivel,
    }
    history.pushState(stateObj,"Adivinanzas","?" + stateObj.nombre + nivel);
    if(!(paginaActual == numPaginas)){
        for (i = paginaActual+1; i <= numPaginas; i++) { 
            $("#juego" + i).remove();
        }
        numPaginas = paginaActual;
    }
    paginaActual++;
    numPaginas ++;
    html= '<a id="juego' + paginaActual + '" href="javascript:historyGo('+paginaActual+')" class="list-group-item his">Juego: '+stateObj.nombre+' Nivel: '+stateObj.level+' Puntuación: '+stateObj.puntos+' Fecha:'+((stateObj.fecha.toString()).split("GMT"))[0]+'</a>';
    $("#history").append(html);
}

