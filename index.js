const http = require("http");
const fs = require("fs");

const PUERTO = 80;

// Async function that serves a static file.
const serveStaticFile = async (file) => {
	return new Promise((resolve, reject) => {
		fs.readFile(file, function (err, data) {
			if (err) reject(err);
			resolve(data);
		});
	});
};

// Function that sends the response.
const sendResponse = (response, content, contentType) => {
	response.writeHead(200, { "Content-Type": contentType });
	response.end(content);
};

// Async function that handles the requests.
const handleRequest = async (request, response) => {
	const url = request.url;

	// GET.
	if (request.method === "GET") {
		let content;
		let contentType;
		switch (url) {
			case "/":
			case "/index.html":
				content = await serveStaticFile("./www/index.html");
				contentType = "text/html";
				break;
			case "/script.js":
				content = await serveStaticFile("./www/script.js");
				contentType = "text/javascript";
				break;
			case "/style.css":
				content = await serveStaticFile("./www/style.css");
				contentType = "text/css";
				break;
			case "/tasks.json":
				content = await serveStaticFile("./tasks.json");
				contentType = "application/json";
				break;
			default:
				content = "Ruta no válida\r\n";
				contentType = "text/html";
		}

		sendResponse(response, content, contentType);
	}
	// POST.
	else if (request.method === "POST") {
		if (url === "/tasklist/update") {
			let body = "";
			request.on("data", (chunk) => {
				body += chunk.toString();
			});
			request.on("end", () => {
				if (body === "") {
					response.writeHead(400, { "Content-Type": "text/html" });
					response.end("No se recibieron datos");
				} else {
					fs.writeFile("tasks.json", body, (err) => {
						if (err) {
							response.writeHead(500, {
								"Content-Type": "text/html",
							});
							response.end("Error al escribir en el archivo");
						} else {
							response.writeHead(200, {
								"Content-Type": "text/html",
							});
							response.end("Tareas actualizadas con éxito");
						}
					});
				}
			});
		} else {
			response.writeHead(404, { "Content-Type": "text/html" });
			response.write("Ruta no válida\r\n");
		}
	}
};

// Server is listening on port 80.
const server = http.createServer(handleRequest);
server.listen(PUERTO);
console.log(`Servidor escuchando en el puerto ${PUERTO}`);
