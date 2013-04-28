// global vars
var fileList;
var logdata;
var timedata;
var dayNames;
var keywordsInLine;
var keywordsNewLine;
var totalFiles;
var totalSize;
var totalEntries;
var plots;

// ------------------------------------------------------------------ PARSER ---

function str_split(string, split_length)
{
	// http://kevin.vanzonneveld.net
	// +     original by: Martijn Wieringa
	// +     improved by: Brett Zamir (http://brett-zamir.me)
	// +     bugfixed by: Onno Marsman
	// +      revised by: Theriault
	// +        input by: Bjorn Roesbeke (http://www.bjornroesbeke.be/)
	// +      revised by: Rafał Kukawski (http://blog.kukawski.pl/)
	// +     improved by: Sylvain RAGOT
	// *       example 1: str_split('Hello World', 3);
	// *       returns 1: ['Hel', 'lo ', 'Wor', 'ld']
	// *       example 2: str_split('Hello World', -3);
	// *       returns 2: ['He', 'llo ', ' Wo', 'rld']
	if (split_length === null) {
		split_length = 1;
	}
	if (string === null) {
		return false;
	}
	string += '';
	if (split_length >= 0) {
		var chunks = [], pos = 0, len = string.length;
		while (pos < len) {
			chunks.push(string.slice(pos, pos += split_length));
		}
	} else {
		var chunks = [], pos = string.length, len = 0;
		while (pos > len) {
			chunks.unshift(string.substring(pos, pos += split_length));
		}
	}
	return chunks;
}

/**
 * Format the qiven SQL query by :
 * 
 * <ul>
 *  <li>colorizing SQL keywords</li>
 *  <li>adding indentation</li>
 *  <li>removing new lines at the beginning or the end of the query</li>
 * </ul>
 * 
 * @param {String} sql_string query to be formatted
 * @returns {String} the formatted query
 * @author Sylvain {25/04/2013}
 */
function format_query(sql_string)
{
	// colorize keywords
	for (var j = 0 ; j < keywordsInLine.length ; j++) {
		sql_string = sql_string.replace(new RegExp(keywordsInLine[j], "g"), "<span class=\"sql_keyword\">" + keywordsInLine[j] + "</span>");
	}
	
	// colorize and indent wekwords
	for (var j = 0 ; j < keywordsNewLine.length ; j++) {
		sql_string = sql_string.replace(new RegExp(keywordsNewLine[j], "g"), "<br/>&nbsp;&nbsp;&nbsp;&nbsp;<span class=\"sql_keyword\">" + keywordsNewLine[j] + "</span>");
	}
	
	// remove useless <br>
	sql_string = sql_string.replace(new RegExp("^(<br/>)*"), '');
	sql_string = sql_string.replace(new RegExp("(<br/>)*$"), '');
	
	return sql_string;
}

/**
 * Add grouped queries to the logdata list<br/>
 * <br/>
 * Some query which have the same <code>"#Time :"</code> are grouped and the <code>"# Time:"</code> line prensent just one time.
 * This function add grouped queries to the list by adding the missing <code>"# Time:"</code> informations.<br/>
 * <br/>
 * <b>Before :</b>
 * <pre>
 * # Time: 130421  6:45:32
 * # User@Host: databaseName[databaseName] @ localhost []
 * # Query_time: 7  Lock_time: 0  Rows_sent: 0  Rows_examined: 0
 * use databaseName;
 * COMMIT;
 * # User@Host: databaseName[databaseName] @ localhost []
 * # Query_time: 7  Lock_time: 0  Rows_sent: 0  Rows_examined: 0
 * COMMIT;
 * # User@Host: databaseName[databaseName] @ localhost []
 * # Query_time: 7  Lock_time: 0  Rows_sent: 0  Rows_examined: 0
 * COMMIT;
 * </pre>
 * 
 * <b>After :</b>
 * <pre>
 * # Time: 130421  6:45:32------------------------------------------\
 * # User@Host: databaseName[databaseName] @ localhost []           | 
 * # Query_time: 7  Lock_time: 0  Rows_sent: 0  Rows_examined: 0    | returned query
 * use databaseName;                                                |
 * COMMIT;----------------------------------------------------------/
 * <u># Time: 130421  6:45:32</u>------------------------------------------\
 * # User@Host: databaseName[databaseName] @ localhost []           |
 * # Query_time: 7  Lock_time: 0  Rows_sent: 0  Rows_examined: 0    |
 * COMMIT;                                                          |
 * <u># Time: 130421  6:45:32</u>                                          + added queries
 * # User@Host: databaseName[databaseName] @ localhost []           |
 * # Query_time: 7  Lock_time: 0  Rows_sent: 0  Rows_examined: 0    |
 * COMMIT;----------------------------------------------------------/
 * </pre>
 * 
 * @param   {array}  queries 
 * @param   {Date}   date    
 * @param   {int}    index   
 * @returns {String} unique query
 * @author  Sylvain {25/04/2013}
 */
function checkMulitpleQueries(queries, date, index)
{
	var added_query;
	var query_string;
	
	if (queries.length === 1) {
		query_string = queries[0];
	} else {
		var d_year  = (date.getFullYear()-2000).toString();	// 2013 - 2000 = 13
		var d_month = (date.getMonth() < 10) 
		? "0" + (date.getMonth() + 1).toString()
		: (date.getMonth() + 1).toString();	// {0-11}
		var d_day   = (date.getDate() < 10) 
		? "0" + (date.getDate()).toString()
		: (date.getDate()).toString();;		// {1-31}
		var d_hour  = date.getHours().toString();			// {0-23}
		var d_mins  = date.getMinutes().toString();			// {0-59}
		var d_sec   = date.getSeconds().toString();			// {0-59}
		
		query_string = queries.shift();
		for (var j = 0 ; j < queries.length ; j++) {
			// build string to be parsed on the next step
			added_query = d_year + d_month + d_day + " " + d_hour + ":" + d_mins + ":" + d_sec + ":" + "\n" + "# User@Host: " + queries[j] + "\n";
			added_query = added_query.replace(new RegExp("<br/>", "g"),"\n");
			
			// added built string to the gloabl array of slow queries
			logdata.splice(index + 1, 0, added_query);
			
			// update progress bar
			document.getElementById('parse_progress').setAttribute('max', logdata.length);
		}
	}
	
	return query_string;
}

/**
 * Analyze log blocks delimited by <code>#Time :</code> tag
 * 
 * @returns void
 */
function processLog()
{
    var log_entry;
    var log_lines;
    var date;
	var time;
	var query_string;
    var entry_stats;
    
    logdata.shift();	// ignore server infos
	
    for (var i = 0; i < logdata.length; i++) {
        
        // load string
        log_entry = "# Time: " + logdata[i];
        logdata[i] = {};
        
        log_lines = log_entry.split("\n");
		
        // get host
        logdata[i].db_name = log_lines[1].split("[")[1].split("]")[0];
		
        // get stats
        entry_stats = log_lines[2].split(" ");
        logdata[i].query_time    = entry_stats[2];  // query time
        logdata[i].lock_time     = entry_stats[5];  // lock time
        logdata[i].rows_sent     = entry_stats[8];  // rows sent
        logdata[i].rows_examined = entry_stats[11]; // row examined
        
        log_lines[0] = log_lines[0].replace('  ', ' ');
        date = str_split(log_lines[0].split(' ')[2],2);
		time = log_lines[0].split(' ')[3].split(":");
        
        // parse date
        date = new Date("20" + date[0], date[1] - 1, date[2], time[0], time[1], time[2]);
        
        var year      = date.getFullYear();
        var month     = date.getUTCMonth() + 1;       if (month < 10) month = "0" + month;
        var day       = date.getDate().toString();    if (day   < 10) day   = "0" + day;
        var dayOfWeek = date.getDay();
        var hours     = date.getHours().toString();   if (hours < 10) hours = "0" + hours;
        var mins      = date.getMinutes().toString(); if (mins  < 10) mins  = "0" + mins;
        
        logdata[i].dateObj = date; // date
        logdata[i].date = year + "/" + month + "/" + day + " " + hours + ":" + mins;
        logdata[i].hour = hours;
        
        // time stats
		timedata[dayOfWeek][hours] = (timedata[dayOfWeek][hours] === undefined) ? 1 : timedata[dayOfWeek][hours] + 1;
		
        // isolate query
        log_lines.shift();
        log_lines.shift();
        log_lines.shift();
        
		// query
		query_string = checkMulitpleQueries(log_lines.join("<br/>").split("# User@Host: "), date, i);
		
		// add formatted query tou the list
		logdata[i].query_string = format_query(query_string);
        
		// update progress bar
		document.getElementById('parse_progress').setAttribute('value', i + 1);
    }
}

// ------------------------------------------------------------------- GRAPH ---

function plot()
{	
	var plot = {};		// timestamps (ms) => [slow queries which occurs in this hour]
	plot.xmin = new Date().getTime();
	plot.xmax = 0;
	plot.ymin = 0;
	plot.ymax = 0;
	plot.timestamps = [];
	plot.queries = [];
	
	// group queries by hours
	for (var i = 0; i < logdata.length; i++) {
		var hour = hour = new Date(logdata[i].date.split(' ')[0] + " " + logdata[i].hour + ":00:00").getTime();
		var queries = new Array(logdata[i].query_string);
		
		if (hour in plot.queries) {
			plot.queries[hour] = plot.queries[hour].concat(queries);
		} else {
			plot.timestamps.push(hour);
			plot.queries[hour] = queries;
		}
		
		// set graph bounds
		if (plot.queries[hour].length > plot.ymax) plot.ymax = plot.queries[hour].length;
		if (plot.queries[hour].length < plot.ymin) plot.ymin = plot.queries[hour].length;
		if (hour > plot.xmax) plot.xmax = hour;
		if (hour < plot.xmin) plot.xmin = hour;
	}
	
	return plot;
}

function graphEntriesFrom(f)
{
	// list of color for styling each curve
	var color = ['white', 'yellow', 'blue', 'red'];
	
	// create svg zone if it doesn't exists
	var svg = document.getElementById('slow_queries_visualization');
	var g = document.getElementById('curves');
	if (svg === null){
		var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute('id', 'slow_queries_visualization');
			svg.setAttribute('version', '1.2');
			svg.setAttribute('width', '100%');
			svg.setAttribute('height', '300px');
			svg.setAttribute('style', 'border: 1px solid #666');
			document.getElementById('graph_zone').appendChild(svg);
		var g_curves = document.createElementNS("http://www.w3.org/2000/svg", "g");
			g_curves.setAttribute('id','curves');
		var g_points = document.createElementNS("http://www.w3.org/2000/svg", "g");
			g_points.setAttribute('id','points');
		
		svg.appendChild(g_curves);
		svg.appendChild(g_points);
	}
	
	var xStep = 50;	// espace (en pixel) entre 2 points
	var yMult = 5;	// facteur d'agrandissement vertical (ordonnées = 3 requêtes pendant une heure => 3*50 = 150 px)
	
	var xmin = new Date().getTime(), xmax = 0, ymin = 0, ymax = 0;
	var x = -xStep;
	
	// create coords list (to be understood by the polyline)
	for (var i = 0; i < plots.length; i++) {
		if (document.getElementById(plots[i].file) === null) {
			// update bounds
			if (plots[i].datas.ymax > ymax) ymax = plots[i].datas.ymax;
			if (plots[i].datas.ymin < ymin) ymin = plots[i].datas.ymin;
			if (plots[i].datas.xmax > xmax) xmax = plots[i].datas.xmax;
			if (plots[i].datas.xmin < xmin) xmin = plots[i].datas.xmin;

			// coords for the file
			var file_coords = "";
			
			// dot coordinates
			for (var j = 0 ; j < plots[i].datas.timestamps.length ; j++) {
				var h = plots[i].datas.timestamps[j];		// abscisse : heure
				var n = plots[i].datas.queries[h].length;	// ordonnées: nombre de requêtes
				var x = x + xStep;
				var y = (ymax - n) * yMult;
				
				file_coords += " " + x + "," + y;
				
				// set point
				var point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
					point.setAttribute('id', f.name + '_' + h);
					point.setAttribute('cx', x);
					point.setAttribute('cy', y);
					point.setAttribute('r', 4);
					point.setAttribute('fill', color[i % color.length]);
				g_points.appendChild(point);
			}

			// create line
			var poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
				poly.setAttribute('id', f.name);
				poly.setAttribute('points', file_coords);
				poly.setAttribute('style', 'fill: none; stroke: ' + color[i % color.length] + '; stroke-width: 2');
			g_curves.appendChild(poly);
		} else {
			x += (plots[i].datas.timestamps.length - 1) * xStep;
		}
	}
	
	// resize graph zone
	var availableWidth = svg.offsetWidth;
	var requiredWidth = j * xStep - xStep;
	var xscale = (requiredWidth !== 0) ? availableWidth / requiredWidth : 1;
	if (xscale > 1 ) xscale = 1;
	
	var availableHeight = svg.offsetHeight;
	var requiredHeight = ymax * yMult;
	var yscale = (requiredHeight !== 0) ? availableHeight / requiredHeight : 1;
	if (yscale > 1 ) yscale = 1;
	
	g_curves.setAttribute('transform', 'scale(' + xscale + ' ' + yscale + ')');
	g_points.setAttribute('transform', 'scale(' + xscale + ' ' + yscale + ')');
}

// -------------------------------------------------------------------- MISC ---

/**
 * Update infos in the aside block displaying details of loaded files
 * 
 * @returns void
 * @author Sylvain {26/04/2013}
 */
function updateInfosBlock()
{
	var st = document.getElementById('fileInfos');		// information sur le status du parsage (<aside>)
	
	st.style.display = 'block';	// affiche le bloc
	st.innerHTML = "<table>"
				 + "<tr><td>Files :   </td><td>" + totalFiles + "</td></tr>"
				 + "<tr><td>Size :    </td><td>" + str_split(totalSize.toString(),-3).join(' ') + " Bytes</td></tr>"
				 + "<tr><td>Entries : </td><td>" + str_split(totalEntries.toString(),-3).join(' ') + "</td></tr>"
				 + "</table><br/>"
				 + "Parsing progress : <progress id='parse_progress' min='0' value='0' max='" + totalEntries + "'></progress>";
}

/**
 * Extract params from navigator query url
 * 
 * @see <a href="http://stackoverflow.com/a/1099670/1230946">http://stackoverflow.com/a/1099670/1230946</a>
 * @param {String} qs current location (ex: <code>document.location.search</code>)
 * @returns {Object} ex: <code>http://example.org?p1=a&p2=b</code> will return <code>{p1: "a", p2: "b"}</code>
 */
function getQueryParams(qs)
{
    qs = qs.split("+").join(" ");

    var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
}

/**
 * Initialize global variables et clean previous upload.
 * 
 * @returns void
 * @author Sylvain {26/04/2013}
 */
function init()
{	
	// initialize parsing vars
	fileList = [];
	logdata = [];
	timedata = [];
	dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
	for (var i = 0; i < 7; i++) {
		timedata[i] = {};
		timedata[i].dayName = dayNames[i];
	}
	
	// SQL keyworks
	keywordsInLine  = [
		'SELECT', 'UPDATE', 'INSERT', 'ALTER', 'DELETE',
		'AS', 'JOIN', 'COMMIT', 'USE', 'BY', 'ASC', 'DESC', 'ON', 'IN'
	];
	
	// SQL keyworks which must be indented
	keywordsNewLine = ['FROM', 'WHERE', 'AND', 'OR', 'INNER', 'LEFT', 'ORDER', 'LIMIT', 'SET'];
	
	// upload stats
	totalFiles = 0;
	totalSize = 0;
	totalEntries = 0;
	
	// initialize plot
	plots = [];
	
	// remove previous uploaded file infos
	var ul = document.getElementById('list_of_files');
	if (ul !== null) ul.parentNode.removeChild(ul);
	
	// clear previous graph
	document.getElementById('graph_zone').innerHTML = "";
}

// ------------------------------------------------------------ LOCAL UPLOAD ---

/**
 * Met à jour le contenu de la drop_zone avec les fichiers chargés
 * 
 * @param   {FileReader} f fichier ajouté à la liste
 * @returns void On met à jour la div <code>#drop_zone</code>
 * @author  Sylvain {25/04/2013}
 */
function updateListOfFiles(f)
{
	var dz = document.getElementById('drop_zone');		// drop zone
	var ul = document.getElementById('list_of_files');	// liste des fichiers
	
	var li = document.createElement('li');
	
	// maj stats
	totalFiles++;
	totalSize += f.size;
	totalEntries += logdata.length - 1; // -1 à cause du shift qui sera fait dans processLog()
	
	// création de la liste des fichiers si elle n'existe pas
	if (ul === null) {
		ul = document.createElement('ul');
		ul.setAttribute('id', 'list_of_files');
		dz.appendChild(ul);
	}
	
	// status du parsage des logs
	updateInfosBlock();
	
	// informations sur le fichier
	li.innerHTML = f.name + " [" + f.size + " Bytes - (" + f.type + ")]";
	ul.appendChild(li);
}

/**
 * Manage file(s) from the <code>drop_zone</code> or the input.
 * 
 * Before starting
 * 
 * @param {FileList} files
 * @returns {undefined}
 */
function handleFile(files)
{
	// reset previous datas
	init();
	
    for (var i = 0, f; f = files[i]; i++) {
		var reader = new FileReader();
		reader.onloadend = (function(f) {
			return function(e) {
				if (e.target.readyState === FileReader.DONE) { 
					logdata = e.target.result.split("# Time: "); 
					updateListOfFiles(f);
					processLog();
					plots.push({file: f.name, datas: plot()});
					graphEntriesFrom(f);
				}
			};
		})(f);
		reader.readAsText(f);
    }
}

/**
 * Add listener to upload elements.
 * 
 * <ul>
 *  <li>event <code>dragover</code> on <code>drop_zone</code> to locally copy files droped in the zone</li>
 *  <li>event <code>drop</code> on <code>drop_zone</code> to start parsing of the dropped file</li>
 *  <li>event <code>change</code> on <code>files</code> input to start parsing of the selected file</li>
 * </ul>
 * 
 * @returns void
 * @author Sylvain {25/04/2013}
 */
function setListeners()
{
    // Setup listener from drop zone.
	var dz = document.getElementById('drop_zone');
	if (dz !== null) {
		dz.addEventListener('dragover', function(e){
			e.stopPropagation(); 
			e.preventDefault(); 
			e.dataTransfer.dropEffect = 'copy';
		}, false);
		dz.addEventListener('drop', function(e){
			e.stopPropagation(); 
			e.preventDefault(); 
			this.className = '';
			handleFile(e.dataTransfer.files);
		}, false);
		
		// style
		dz.addEventListener('dragenter', function(){this.className = 'dragged'; return false;}, false);
		dz.addEventListener('dragleave', function(){this.className = ''; return false;}, false);
	}
	
	// Setup listener from input.
	document.getElementById('files').addEventListener('change', function(e){handleFile(e.target.files);}, false);
	
	// default values from url query string
	var defaults = getQueryParams(document.location.search);
	if ("remote_path" in defaults) {
		document.getElementById('remote_path').value =defaults.remote_path;
	}
}

// ----------------------------------------------------------- REMOTE UPLOAD ---

function ajax_getList()
{
	init();
	
	var path = document.getElementById('remote_path').value;
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'php/fetchListOfFiles.php', true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				var select = document.getElementById('select_files');
					select.innerHTML = "";
				var files = JSON.parse(xhr.responseText);
				if (xhr.responseText !== "[]"){
					for (var i in files) {
						var fileName = files[i].split(' ').pop();

						var choice = document.createElement('div');

						var checkbox = document.createElement('input');
						checkbox.setAttribute('id', "cb_" + fileName);
						checkbox.setAttribute('type', 'checkbox');
						checkbox.addEventListener('change', ajax_getFile);

						var label = document.createElement('label');
						label.setAttribute('id', 'lb_' + fileName);
						label.setAttribute('for', 'cb_' + fileName);
						label.setAttribute('class', 'code');
						label.innerHTML = files[i];

						choice.appendChild(checkbox);
						choice.appendChild(label);
						select.appendChild(choice);
					}
				} else {
					select.innerHTML = "No files available";
				}
			} else {
				alert("Error : " + xhr.statusText);
				select.innerHTML = xhr.responseText;
			}
		}
	};
	xhr.send("path=" + path);
}

function ajax_getFile()
{
	if (this.checked === true) {
		var baseName = document.getElementById('remote_path').value;
		var fileName = this.id.split('_').pop();
		var filePath = (baseName.charAt(baseName.length-1) === "/")
				 ? baseName + fileName
				 : baseName + '/' + fileName;

		var xhr = new XMLHttpRequest();
		xhr.open('POST', 'php/fetchFile.php', true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					var content = xhr.responseText;
					var f = {};
					f.name = filePath;
					f.size = content.length;
					f.type = "";

					logdata = content.split("# Time: "); 
					updateListOfFiles(f);
					processLog();
					plots.push({file: f.name, datas: plot()});
					graphEntriesFrom(f);

				} else {
					alert("Error : " + xhr.statusText);
				}
			}
		};
		xhr.send("file=" + filePath);
	}
	
//	alert(this.checked);
}