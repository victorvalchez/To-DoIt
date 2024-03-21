let taskList = [];

// Function that loads the tasks from the tasks.json file.
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

// Function that loads the tasks in the HTML.
const loadTasks = async () => {
	taskList = await takeTasks();

	const taskListElem = document.querySelector("#container"); // The container where the tasks are going to be added.

	// We remove the tasks that are already in the container.
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

	// The rest of the events are loaded.
	loadRest();
};

// Function that saves the tasks in the tasks.json file using POST.
const saveTasks = async () => {
	navigator.vibrate(30);

	try {
		const url = `${window.location.origin}/tasklist/update`;
		console.log(`Fetching from: ${url}`);
		const response = await fetch("/tasklist/update", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(taskList, null, 4),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
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

// Function that adds a task to the list.
const add = () => {
	const taskName = document.querySelector("#task-name").value;

	if (taskName !== "") {
		const task = { id: taskList.length + 1, title: taskName, done: false };
		taskList.push(task);
		document.querySelector("#task-name").value = "";
		saveTasks();
	}
};

// Function that removes a task from the list.
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

// Function that marks a task as done or not done.
const toggleDone = (task) => {
	taskList.forEach((t) => {
		if (task.id.includes("task" + t.id)) {
			t.done = !t.done;
		}
	});
	saveTasks();
};

// Function that loads the rest of the events.
const loadRest = () => {
	let tasks = document
		.getElementById("container")
		.querySelectorAll('[id^="task"]');

	// Button to add a task.
	const addButton = document.querySelector("#fab-add");

	// The task is added when the + button is pressed or clicked and when enter is pressed.
	addButton.addEventListener("touchend", add);
	addButton.addEventListener("click", add);
	document.querySelector("#task-name").addEventListener("keyup", (event) => {
		if (event.keyCode === 13) {
			event.preventDefault();
			addButton.click();
		}
	});

	// The events are added to each task.
	tasks.forEach((task) => {
		let timer;

		// Starts the long press event.
		task.addEventListener("touchstart", () => {
			navigator.vibrate(15);
			timer = setTimeout(() => {
				toggleDone(task);
			}, 2000);
		});

		// Ends the long press event.
		task.addEventListener("touchend", () => {
			clearTimeout(timer);
		});
		let touchStartX,
			touchEndX,
			startTime,
			taskX = 0;
		const TIME_THRESHOLD = 300,
			SPACE_THRESHOLD = 200;

		// Starts the swipe event.
		task.addEventListener(
			"touchstart",
			(event) => {
				touchStartX = event.touches[0].clientX;
				taskX = event.touches[0].clientX;
				startTime = event.timeStamp;
			},
			{ passive: false },
		);

		// Ends the swipe event.
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

		// Ends the swipe event.
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

// We load the tasks when the start button is pressed.
const start_button = document.querySelector("#start-button");

// We hide the initial screen and show the rest of the elements.
start_button.addEventListener("click", () => {
	document.querySelector("#initial-screen").style.display = "none";
	document.querySelector("#header").style.display = "flex";
	document.querySelector("#content").style.display = "block";
	document.querySelector("#add-task-container").style.display = "flex";

	// We load the tasks and the rest of the events.
	loadTasks();
});