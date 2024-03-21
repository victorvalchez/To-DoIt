// Lista de tareas
let taskList = [];

// Función que carga las tareas desde el archivo tasks.json.
const takeTasks = async () => {
	try {
		console.log(new URL("../tasks.json", window.location.href).href);
		const response = await fetch("../tasks.json", { method: "GET" });
		const data = await response.json();
		return data;
	} catch (error) {
		console.log(error);
	}
};

// Función que carga las tareas en el HTML.
const loadTasks = async () => {
	taskList = await takeTasks();

	const taskListElem = document.querySelector("#container"); // El contenedor donde se van a agregar las tareas.

	// Removemos las tareas que ya están en el contenedor.
	while (taskListElem.firstChild) {
		taskListElem.removeChild(taskListElem.firstChild);
	}

	let i = 1;
	taskList.forEach((task) => {
		const listElem = document.createElement("div");
		listElem.id = "task" + i;
		listElem.innerHTML = `${task.title}`;
		taskListElem.appendChild(listElem);

		if (task.done) {
			listElem.classList.add("done");
		}

		i++;
	});

	// Se cargan el resto de los eventos.
	loadRest();
};

// Función que guarda las tareas en el archivo tasks.json usando POST.
const saveTasks = async () => {
	navigator.vibrate(30);

	try {
		const url = `${window.location.origin}/tasklist/update`;
		console.log(`Obteniendo desde: ${url}`);
		const response = await fetch("/tasklist/update", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(taskList, null, 4),
		});

		if (!response.ok) {
			throw new Error(`¡Error HTTP! estado: ${response.status}`);
		} else {
			const responseBody = await response.text();
			console.log(responseBody);
			loadTasks();
		}
	} catch (error) {
		console.log("Error al guardar las tareas.");
		console.log(error);
	}
};

// Función que añade una tarea a la lista.
const add = () => {
	const taskName = document.querySelector("#task-name").value;

	if (taskName !== "") {
		const task = { id: taskList.length + 1, title: taskName, done: false };
		taskList.push(task);
		document.querySelector("#task-name").value = "";
		saveTasks();
	}
};

// Función que elimina una tarea de la lista.
const remove = (taskElem) => {
	const taskId = parseInt(taskElem.id.replace("task", ""));

	taskList = taskList.filter((t) => t.id !== taskId);

	let i = 1;
	taskList.forEach((task) => {
		task.id = i;
		i++;
	});

	saveTasks();
};

// Función que marca una tarea como hecha o no hecha.
const toggleDone = (task) => {
	taskList.forEach((t) => {
		if (task.id.includes("task" + t.id)) {
			t.done = !t.done;
		}
	});

	saveTasks();
};

// Función que carga el resto de los eventos.
const loadRest = () => {
	let tasks = document
		.getElementById("container")
		.querySelectorAll('[id^="task"]');

	// Botón para añadir una tarea.
	const addButton = document.querySelector("#fab-add");

	// La tarea se añade cuando se presiona o hace clic en el botón + o cuando se presiona Enter.
	addButton.addEventListener("touchend", add);
	addButton.addEventListener("click", add);
	document.querySelector("#task-name").addEventListener("keyup", (event) => {
		if (event.keyCode === 13) {
			event.preventDefault();
			addButton.click();
		}
	});

	// Se añaden los eventos a cada tarea.
	tasks.forEach((task) => {
		let timer;

		// Inicia el evento de presión larga.
		task.addEventListener("touchstart", () => {
			navigator.vibrate(15);
			timer = setTimeout(() => {
				toggleDone(task);
			}, 2000);
		});

		// Finaliza el evento de presión larga.
		task.addEventListener("touchend", () => {
			clearTimeout(timer);
		});

		let touchStartX,
			touchEndX,
			startTime,
			taskX = 0;

		const TIME_THRESHOLD = 300,
			SPACE_THRESHOLD = 200;

		// Inicia el evento de deslizamiento a la derecha.
		task.addEventListener(
			"touchstart",
			(event) => {
				touchStartX = event.touches[0].clientX;
				taskX = event.touches[0].clientX;
				startTime = event.timeStamp;
			},
			{ passive: false },
		);

		task.addEventListener(
			"touchmove",
			(event) => {
				touchEndX = event.touches[0].clientX;
				if (touchEndX - taskX > 0) {
					task.style.transform =
						"translateX(" +
						(event.touches[0].clientX - taskX) +
						"px)";
					task.style.transition = "transform 0s";
				}
			},
			{ passive: false },
		);

		// Finaliza el evento de deslizamiento a la derecha.
		task.addEventListener("touchend", (event) => {
			endTime = event.timeStamp;
			touchEndX = event.changedTouches[0].clientX;

			if (
				touchEndX - taskX > SPACE_THRESHOLD &&
				endTime - startTime < TIME_THRESHOLD
			) {
				task.style.transform = "translateX(100%)";
				task.style.transition = "transform 0.4s";
			} else {
				task.style.transform = "translateX(0)";
				task.style.transition = "transform 0.4s";
			}

			if (
				endTime - startTime < TIME_THRESHOLD &&
				touchEndX - touchStartX > SPACE_THRESHOLD
			) {
				task.style.transform = "translateX(120%)";
				task.style.transition = "transform 0.4s";

				task.addEventListener("transitionend", () => {
					remove(task);
				});
			}
		});
	});
};

// Cargamos las tareas cuando se presiona el botón de inicio.
const start_button = document.querySelector("#start-button");

// Ocultamos la pantalla inicial y mostramos el resto de los elementos.
start_button.addEventListener("click", () => {
	document.querySelector("#initial-screen").style.display = "none";
	document.querySelector("#header").style.display = "flex";
	document.querySelector("#content").style.display = "block";
	document.querySelector("#add-task-container").style.display = "flex";

	// Cargamos las tareas y el resto de los eventos.
	loadTasks();
});
