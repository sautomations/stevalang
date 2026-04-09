/**
 * Fitness Tracker
 * Persistent workout logging using localStorage
 */

(function() {
	'use strict';

	var STORAGE_KEY = 'fitnessTrackerWorkouts';
	var exerciseCount = 0;

	// ---- Data Layer ----

	function getWorkouts() {
		var data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	}

	function saveWorkouts(workouts) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
	}

	function addWorkout(workout) {
		var workouts = getWorkouts();
		workout.id = Date.now().toString();
		workouts.unshift(workout);
		saveWorkouts(workouts);
		return workout;
	}

	function deleteWorkout(id) {
		var workouts = getWorkouts();
		workouts = workouts.filter(function(w) { return w.id !== id; });
		saveWorkouts(workouts);
	}

	// ---- Seed First Workout ----

	function seedFirstWorkout() {
		var workouts = getWorkouts();
		if (workouts.length === 0) {
			var firstWorkout = {
				id: '1744156800000',
				date: '2026-04-09',
				type: 'Legs',
				notes: 'First workout! Legs day - feeling strong.',
				exercises: [
					{
						name: 'Squat',
						sets: [
							{ weight: 45, reps: 10 },
							{ weight: 135, reps: 8 },
							{ weight: 185, reps: 5 },
							{ weight: 185, reps: 8 }
						]
					},
					{
						name: 'Sumo Deadlift',
						sets: [
							{ weight: 45, reps: 10 },
							{ weight: 135, reps: 7 },
							{ weight: 225, reps: 6 },
							{ weight: 275, reps: 6 },
							{ weight: 295, reps: 2 }
						]
					},
					{
						name: 'Donkey Kicks (Machine) - superset w/ Leg Extension',
						sets: [
							{ weight: 70, reps: 10 },
							{ weight: 110, reps: 10 },
							{ weight: 150, reps: 10 },
							{ weight: 150, reps: 10 }
						]
					},
					{
						name: 'Leg Extension - superset w/ Donkey Kicks',
						sets: [
							{ weight: 90, reps: 10 },
							{ weight: 130, reps: 10 },
							{ weight: 130, reps: 10 },
							{ weight: 130, reps: 10 }
						]
					},
					{
						name: 'Seated Leg Curl',
						sets: [
							{ weight: 70, reps: 12 },
							{ weight: 90, reps: 12 },
							{ weight: 130, reps: 12 }
						]
					},
					{
						name: 'Ab Crunch Machine',
						sets: [
							{ weight: 80, reps: 20 },
							{ weight: 80, reps: 20 }
						]
					},
					{
						name: 'Leg Raises',
						sets: [
							{ weight: 0, reps: 20 }
						]
					}
				]
			};
			workouts.push(firstWorkout);
			saveWorkouts(workouts);
		}
	}

	// ---- UI: Exercise Form Builder ----

	function createSetRow(setNum, weight, reps) {
		var row = document.createElement('div');
		row.className = 'set-row';
		row.innerHTML =
			'<span class="set-number">' + setNum + '</span>' +
			'<input type="number" class="set-weight" placeholder="lbs" value="' + (weight || '') + '">' +
			'<input type="number" class="set-reps" placeholder="reps" value="' + (reps || '') + '">' +
			'<button type="button" class="remove-set" title="Remove set">&times;</button>';

		row.querySelector('.remove-set').addEventListener('click', function() {
			row.remove();
			renumberSets(row.parentNode);
		});

		return row;
	}

	function renumberSets(container) {
		var rows = container.querySelectorAll('.set-row');
		for (var i = 0; i < rows.length; i++) {
			rows[i].querySelector('.set-number').textContent = (i + 1);
		}
	}

	function createExerciseEntry(name) {
		exerciseCount++;
		var entry = document.createElement('div');
		entry.className = 'exercise-entry';
		entry.setAttribute('data-exercise-id', exerciseCount);

		entry.innerHTML =
			'<div class="exercise-header">' +
				'<input type="text" class="exercise-name" placeholder="Exercise name (e.g. Squat, Bench Press)" value="' + (name || '') + '">' +
				'<button type="button" class="remove-exercise">Remove</button>' +
			'</div>' +
			'<div class="sets-container">' +
				'<div class="sets-header">' +
					'<span>Set</span>' +
					'<span>Weight (lbs)</span>' +
					'<span>Reps</span>' +
					'<span></span>' +
				'</div>' +
			'</div>' +
			'<button type="button" class="add-set-btn">+ Add Set</button>';

		entry.querySelector('.remove-exercise').addEventListener('click', function() {
			entry.remove();
		});

		entry.querySelector('.add-set-btn').addEventListener('click', function() {
			var setsContainer = entry.querySelector('.sets-container');
			var setNum = setsContainer.querySelectorAll('.set-row').length + 1;
			setsContainer.appendChild(createSetRow(setNum, '', ''));
		});

		// Add one empty set by default
		var setsContainer = entry.querySelector('.sets-container');
		setsContainer.appendChild(createSetRow(1, '', ''));

		return entry;
	}

	// ---- UI: Render Workout History ----

	function formatDate(dateStr) {
		var parts = dateStr.split('-');
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return months[parseInt(parts[1], 10) - 1] + ' ' + parseInt(parts[2], 10) + ', ' + parts[0];
	}

	function renderWorkoutCard(workout) {
		var card = document.createElement('div');
		card.className = 'workout-card';

		var exercisesHtml = '';
		var totalSets = 0;
		var totalVolume = 0;

		for (var i = 0; i < workout.exercises.length; i++) {
			var exercise = workout.exercises[i];
			var setsHtml = '';
			for (var j = 0; j < exercise.sets.length; j++) {
				var set = exercise.sets[j];
				totalSets++;
				var weight = set.weight || 0;
				var reps = set.reps || '-';
				totalVolume += (parseInt(weight, 10) || 0) * (parseInt(set.reps, 10) || 0);

				setsHtml +=
					'<tr>' +
						'<td>' + (j + 1) + '</td>' +
						'<td>' + (weight ? weight + ' lbs' : '-') + '</td>' +
						'<td>' + reps + '</td>' +
					'</tr>';
			}

			exercisesHtml +=
				'<div class="exercise-log">' +
					'<h4>' + escapeHtml(exercise.name) + '</h4>' +
					'<table>' +
						'<thead><tr><th>Set</th><th>Weight</th><th>Reps</th></tr></thead>' +
						'<tbody>' + setsHtml + '</tbody>' +
					'</table>' +
				'</div>';
		}

		var notesHtml = workout.notes
			? '<div class="workout-notes">"' + escapeHtml(workout.notes) + '"</div>'
			: '';

		card.innerHTML =
			'<div class="workout-card-header">' +
				'<div>' +
					'<h3>' + escapeHtml(workout.type) + ' Day</h3>' +
					'<span class="workout-date">' + formatDate(workout.date) + '</span>' +
				'</div>' +
				'<span class="workout-badge">' + escapeHtml(workout.type) + '</span>' +
			'</div>' +
			exercisesHtml +
			notesHtml +
			'<div class="workout-card-actions">' +
				'<button class="delete-workout" data-id="' + workout.id + '">Delete</button>' +
			'</div>';

		card.querySelector('.delete-workout').addEventListener('click', function() {
			if (confirm('Delete this workout?')) {
				deleteWorkout(workout.id);
				renderAll();
				showMessage('Workout deleted.');
			}
		});

		return card;
	}

	function escapeHtml(str) {
		var div = document.createElement('div');
		div.appendChild(document.createTextNode(str));
		return div.innerHTML;
	}

	function renderHistory(filter) {
		var container = document.getElementById('history-container');
		container.innerHTML = '';

		var workouts = getWorkouts();
		if (filter && filter !== 'all') {
			workouts = workouts.filter(function(w) { return w.type === filter; });
		}

		if (workouts.length === 0) {
			container.innerHTML = '<div class="empty-state"><p>No workouts logged yet. Start by adding your first workout above!</p></div>';
			return;
		}

		for (var i = 0; i < workouts.length; i++) {
			container.appendChild(renderWorkoutCard(workouts[i]));
		}
	}

	function renderStats() {
		var workouts = getWorkouts();
		var totalExercises = 0;
		var totalSets = 0;
		var totalVolume = 0;

		for (var i = 0; i < workouts.length; i++) {
			totalExercises += workouts[i].exercises.length;
			for (var j = 0; j < workouts[i].exercises.length; j++) {
				var sets = workouts[i].exercises[j].sets;
				totalSets += sets.length;
				for (var k = 0; k < sets.length; k++) {
					totalVolume += (parseInt(sets[k].weight, 10) || 0) * (parseInt(sets[k].reps, 10) || 0);
				}
			}
		}

		document.getElementById('total-workouts').textContent = workouts.length;
		document.getElementById('total-exercises').textContent = totalExercises;
		document.getElementById('total-sets').textContent = totalSets;
		document.getElementById('total-volume').textContent = totalVolume.toLocaleString();
	}

	function populateFilterDropdown() {
		var workouts = getWorkouts();
		var types = {};
		for (var i = 0; i < workouts.length; i++) {
			types[workouts[i].type] = true;
		}

		var select = document.getElementById('filter-type');
		var currentVal = select.value;
		select.innerHTML = '<option value="all">All</option>';

		var typeNames = Object.keys(types).sort();
		for (var j = 0; j < typeNames.length; j++) {
			var opt = document.createElement('option');
			opt.value = typeNames[j];
			opt.textContent = typeNames[j];
			select.appendChild(opt);
		}

		select.value = currentVal || 'all';
	}

	function renderAll() {
		renderStats();
		populateFilterDropdown();
		renderHistory(document.getElementById('filter-type').value);
	}

	// ---- UI: Messages ----

	function showMessage(text) {
		var msg = document.createElement('div');
		msg.className = 'success-message';
		msg.textContent = text;
		document.body.appendChild(msg);
		setTimeout(function() {
			if (msg.parentNode) msg.parentNode.removeChild(msg);
		}, 2500);
	}

	// ---- Form Handling ----

	function collectFormData() {
		var date = document.getElementById('workout-date').value;
		var type = document.getElementById('workout-type').value;
		if (type === 'Custom') {
			type = document.getElementById('custom-type').value.trim() || 'Custom';
		}
		var notes = document.getElementById('workout-notes').value.trim();

		var exercises = [];
		var entries = document.querySelectorAll('#exercises-container .exercise-entry');

		for (var i = 0; i < entries.length; i++) {
			var entry = entries[i];
			var name = entry.querySelector('.exercise-name').value.trim();
			if (!name) continue;

			var sets = [];
			var setRows = entry.querySelectorAll('.set-row');
			for (var j = 0; j < setRows.length; j++) {
				var weight = setRows[j].querySelector('.set-weight').value;
				var reps = setRows[j].querySelector('.set-reps').value;
				if (weight || reps) {
					sets.push({
						weight: weight ? parseInt(weight, 10) : '',
						reps: reps ? parseInt(reps, 10) : ''
					});
				}
			}

			if (sets.length > 0) {
				exercises.push({ name: name, sets: sets });
			}
		}

		return { date: date, type: type, notes: notes, exercises: exercises };
	}

	function resetForm() {
		document.getElementById('workout-date').valueAsDate = new Date();
		document.getElementById('workout-type').value = 'Legs';
		document.getElementById('workout-notes').value = '';
		document.getElementById('custom-type-group').style.display = 'none';
		document.getElementById('custom-type').value = '';
		document.getElementById('exercises-container').innerHTML = '';
		addExerciseEntry();
	}

	function addExerciseEntry(name) {
		document.getElementById('exercises-container').appendChild(createExerciseEntry(name || ''));
	}

	// ---- Init ----

	function init() {
		// Seed first workout if empty
		seedFirstWorkout();

		// Set today's date
		var dateInput = document.getElementById('workout-date');
		dateInput.valueAsDate = new Date();

		// Add first empty exercise entry
		addExerciseEntry();

		// Show/hide custom type field
		document.getElementById('workout-type').addEventListener('change', function() {
			document.getElementById('custom-type-group').style.display =
				this.value === 'Custom' ? 'block' : 'none';
		});

		// Add exercise button
		document.getElementById('add-exercise-btn').addEventListener('click', function() {
			addExerciseEntry();
		});

		// Filter change
		document.getElementById('filter-type').addEventListener('change', function() {
			renderHistory(this.value);
		});

		// Form submit
		document.getElementById('workout-form').addEventListener('submit', function(e) {
			e.preventDefault();

			var data = collectFormData();

			if (!data.date) {
				alert('Please select a date.');
				return;
			}
			if (data.exercises.length === 0) {
				alert('Please add at least one exercise with sets.');
				return;
			}

			addWorkout(data);
			showMessage('Workout saved successfully!');
			resetForm();
			renderAll();

			// Scroll to history
			var historySection = document.getElementById('workout-history');
			if (historySection) {
				historySection.scrollIntoView({ behavior: 'smooth' });
			}
		});

		// Initial render
		renderAll();
	}

	// Wait for DOM
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

})();
