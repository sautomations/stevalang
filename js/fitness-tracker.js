/**
 * Fitness Tracker
 * Persistent workout logging using localStorage
 */

(function() {
	'use strict';

	var STORAGE_KEY = 'fitnessTrackerWorkouts';
	var exerciseCount = 0;

	// ---- Challenge Config ----

	var CHALLENGE = {
		date: '2026-06-14',
		trainingStart: '2026-04-13',
		baselines: {
			deadlift: 295,
			bench: 225,
			pullups: 6,
			hang: 30
		},
		targets: {
			deadlift: 330,
			bench: 250,
			pullups: 12,
			hang: 60
		}
	};

	var TRAINING_PLAN = [
		{
			week: 1, phase: 'Hypertrophy Base', start: '2026-04-13',
			sessions: [
				{ day: 'Mon', name: 'Pull Day', exercises: ['Deadlift 3x6 @ 205', 'Strict Pull-ups 5x3-4', 'Barbell Row 4x8 @ 135', 'Dead Hang 4x20 sec', 'Face Pulls 3x15'] },
				{ day: 'Wed', name: 'Push Day', exercises: ['Bench Press 3x8 @ 145', 'OHP 3x8', 'Close-Grip Bench 3x10', 'DB Flyes 3x12', 'Tricep Pushdowns 3x12', 'Farmer Carry 3x40 sec'] },
				{ day: 'Fri', name: 'Grip & Pull-ups', exercises: ['Weighted Pull-ups 6x3', 'Lat Pulldown 4x10', 'Dead Hang 4x30 sec', 'Towel Hang 3x15 sec', 'Hammer Curls 3x12', 'Plate Pinch 3x20 sec'] }
			]
		},
		{
			week: 2, phase: 'Hypertrophy Base', start: '2026-04-20',
			sessions: [
				{ day: 'Mon', name: 'Pull Day', exercises: ['Deadlift 3x6 @ 215', 'Strict Pull-ups 5x4', 'Barbell Row 4x8 @ 140', 'Dead Hang 4x25 sec', 'Face Pulls 3x15'] },
				{ day: 'Wed', name: 'Push Day', exercises: ['Bench Press 3x8 @ 155', 'OHP 3x8', 'Close-Grip Bench 3x10', 'DB Flyes 3x12', 'Tricep Pushdowns 3x12', 'Farmer Carry 3x40 sec'] },
				{ day: 'Fri', name: 'Grip & Pull-ups', exercises: ['Weighted Pull-ups 6x3 (+5 lb)', 'Lat Pulldown 4x10', 'Dead Hang 4x30 sec', 'Towel Hang 3x15 sec', 'Hammer Curls 3x12', 'Plate Pinch 3x25 sec'] }
			]
		},
		{
			week: 3, phase: 'Hypertrophy Base', start: '2026-04-27',
			sessions: [
				{ day: 'Mon', name: 'Pull Day', exercises: ['Deadlift 4x5 @ 220', 'Strict Pull-ups 5x4', 'Barbell Row 4x8 @ 145', 'Dead Hang 4x30 sec', 'Face Pulls 3x15'] },
				{ day: 'Wed', name: 'Push Day', exercises: ['Bench Press 4x6 @ 165', 'OHP 3x8', 'Close-Grip Bench 3x10', 'DB Flyes 3x12', 'Tricep Pushdowns 3x12', 'Farmer Carry 3x45 sec'] },
				{ day: 'Fri', name: 'Grip & Pull-ups', exercises: ['Weighted Pull-ups 6x3 (+10 lb)', 'Lat Pulldown 4x10', 'Dead Hang 4x35 sec', 'Towel Hang 3x20 sec', 'Hammer Curls 3x12', 'Plate Pinch 3x25 sec'] }
			]
		},
		{
			week: 4, phase: 'Strength', start: '2026-05-04',
			sessions: [
				{ day: 'Mon', name: 'Pull Day', exercises: ['Deadlift 4x5 @ 235', 'Pull-ups TEST MAX (target 8)', 'Barbell Row 4x6 @ 155', 'Dead Hang TEST MAX (target 45 sec)', 'Face Pulls 3x15'] },
				{ day: 'Wed', name: 'Push Day', exercises: ['Bench Press 4x5 @ 175', 'OHP 4x6', 'Close-Grip Bench 3x8', 'DB Flyes 3x12', 'Tricep Pushdowns 3x12', 'Farmer Carry 3x45 sec'] },
				{ day: 'Fri', name: 'Grip & Pull-ups', exercises: ['Strict Pull-ups 4x4', 'Weighted Pull-ups 3x3 (+15 lb)', 'Dead Hang 4x35 sec', 'Towel Hang 3x20 sec', 'Plate Pinch 3x30 sec'] }
			]
		},
		{
			week: 5, phase: 'Strength', start: '2026-05-11',
			sessions: [
				{ day: 'Mon', name: 'Pull Day', exercises: ['Deadlift 4x4 @ 245', 'Strict Pull-ups 5x5', 'Barbell Row 4x6 @ 165', 'Dead Hang 4x40 sec', 'Face Pulls 3x15'] },
				{ day: 'Wed', name: 'Push Day', exercises: ['Bench Press 4x4 @ 180', 'OHP 4x5', 'Close-Grip Bench 3x6', 'DB Flyes 3x12', 'Tricep Pushdowns 3x12', 'Farmer Carry 3x50 sec'] },
				{ day: 'Fri', name: 'Grip & Pull-ups', exercises: ['Weighted Pull-ups 3x3 (+20 lb)', 'Lat Pulldown 4x8', 'Weighted Hang 2x15 sec (+10 lb)', 'Towel Hang 3x25 sec', 'Plate Pinch 3x30 sec'] }
			]
		},
		{
			week: 6, phase: 'Strength', start: '2026-05-18',
			sessions: [
				{ day: 'Mon', name: 'Pull Day', exercises: ['Deadlift 5x3 @ 250', 'Strict Pull-ups 4x5', 'Barbell Row 4x6 @ 175', 'Dead Hang 4x40 sec', 'Face Pulls 3x15'] },
				{ day: 'Wed', name: 'Push Day', exercises: ['Bench Press 5x3 @ 190', 'OHP 4x5', 'Close-Grip Bench 3x6', 'DB Flyes 3x10', 'Tricep Pushdowns 3x12', 'Farmer Carry 3x60 sec'] },
				{ day: 'Fri', name: 'Grip & Pull-ups', exercises: ['Weighted Pull-ups 3x3 (+25 lb)', 'Weighted Hang 2x20 sec (+15 lb)', 'Lat Pulldown 4x8', 'Towel Hang 3x25 sec', 'Plate Pinch 3x30 sec'] }
			]
		},
		{
			week: 7, phase: 'Peak', start: '2026-05-25',
			sessions: [
				{ day: 'Mon', name: 'Peak Deadlift', exercises: ['Deadlift: work to 1x265 (90%)', 'Then 2x2 @ 245', 'Strict Pull-ups 3x5', 'Dead Hang 3x30 sec'] },
				{ day: 'Wed', name: 'Peak Bench', exercises: ['Bench Press: work to 1x205 (90%)', 'Then 2x2 @ 190', 'OHP 3x5', 'Close-Grip Bench 3x5'] },
				{ day: 'Fri', name: 'Test Pull-ups & Hang', exercises: ['Pull-ups TEST MAX (target 10)', 'Dead Hang TEST MAX (target 55 sec)', 'Light rows 3x8'] }
			]
		},
		{
			week: 8, phase: 'Peak', start: '2026-06-01',
			sessions: [
				{ day: 'Mon', name: 'Opener Deadlift', exercises: ['Deadlift 1x280 (95% opener test)', '2x2 @ 225', 'Light pull-ups 3x3'] },
				{ day: 'Wed', name: 'Opener Bench', exercises: ['Bench Press 1x215 (95% opener test)', '2x2 @ 185', 'Light OHP 3x5'] },
				{ day: 'Fri', name: 'Maintain', exercises: ['Strict Pull-ups 3x4 (easy)', 'Dead Hang 2x30 sec', 'Light rows 3x8'] }
			]
		},
		{
			week: 9, phase: 'Taper', start: '2026-06-08',
			sessions: [
				{ day: 'Mon', name: 'CNS Primer', exercises: ['Deadlift 2x3 @ 175 (60%)', 'Bench 2x3 @ 135 (60%)', '2-3 easy pull-ups', '1x20 sec hang'] },
				{ day: 'Sat', name: 'REST — Carb up', exercises: ['No lifting. Walk, stretch, visualize.'] },
				{ day: 'Sun', name: 'COMPETITION DAY', exercises: ['Deadlift: 295 → 315 → 335', 'Bench: 225 → 240 → 255', 'Pull-ups: max reps', 'Dead Hang: max time'] }
			]
		}
	];

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

			var secondWorkout = {
				id: '1744329600000',
				date: '2026-04-11',
				type: 'Upper Body',
				notes: 'Unscheduled Saturday session. Moderate intensity to preserve CNS for Monday pull day.',
				exercises: [
					{
						name: 'Incline Chest Press (Plate Machine)',
						sets: [
							{ weight: 12, reps: 20 },
							{ weight: 102, reps: 10 },
							{ weight: 192, reps: 6 },
							{ weight: 242, reps: 5 }
						]
					},
					{
						name: 'Flat Bench Press',
						sets: [
							{ weight: 145, reps: 6 },
							{ weight: 185, reps: 3 },
							{ weight: 195, reps: 4 },
							{ weight: 185, reps: 5 }
						]
					},
					{
						name: 'Dead Hang',
						sets: [
							{ weight: 0, reps: 30 },
							{ weight: 0, reps: 20 },
							{ weight: 0, reps: 30 }
						]
					},
					{
						name: 'Shoulder Press (Machine)',
						sets: [
							{ weight: 80, reps: 8 },
							{ weight: 100, reps: 6 }
						]
					}
				]
			};

			workouts.push(firstWorkout);
			workouts.push(secondWorkout);
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
		renderChallengePrep();
		renderTrainingSchedule();
	}

	// ---- Challenge Prep Render ----

	function daysBetween(d1, d2) {
		var ms = new Date(d2).getTime() - new Date(d1).getTime();
		return Math.ceil(ms / (1000 * 60 * 60 * 24));
	}

	function getBestFromWorkouts() {
		var workouts = getWorkouts();
		var best = {
			deadlift: CHALLENGE.baselines.deadlift,
			bench: CHALLENGE.baselines.bench,
			pullups: CHALLENGE.baselines.pullups,
			hang: CHALLENGE.baselines.hang
		};

		for (var i = 0; i < workouts.length; i++) {
			var exercises = workouts[i].exercises;
			for (var j = 0; j < exercises.length; j++) {
				var nameLower = exercises[j].name.toLowerCase();
				var sets = exercises[j].sets;

				for (var k = 0; k < sets.length; k++) {
					var weight = parseInt(sets[k].weight, 10) || 0;
					var reps = parseInt(sets[k].reps, 10) || 0;

					// Deadlift (any variation)
					if (nameLower.indexOf('deadlift') !== -1 && weight > best.deadlift) {
						best.deadlift = weight;
					}
					// Bench press (not close-grip for the main event)
					if (nameLower.indexOf('bench press') !== -1 && nameLower.indexOf('close') === -1 && weight > best.bench) {
						best.bench = weight;
					}
					// Pull-ups (strict, bodyweight — no added weight)
					if ((nameLower.indexOf('pull-up') !== -1 || nameLower.indexOf('pull up') !== -1 || nameLower.indexOf('pullup') !== -1) &&
					    nameLower.indexOf('weighted') === -1 && nameLower.indexOf('lat') === -1 &&
					    weight === 0 && reps > best.pullups) {
						best.pullups = reps;
					}
					// Dead hang (stored as weight=0, reps=seconds)
					if (nameLower.indexOf('dead hang') !== -1 && weight === 0 && reps > best.hang) {
						best.hang = reps;
					}
				}
			}
		}
		return best;
	}

	function getCurrentPhase() {
		var today = new Date();
		var start = new Date(CHALLENGE.trainingStart);
		var compDate = new Date(CHALLENGE.date);

		if (today < start) return 'Not started yet';
		if (today >= compDate) return 'Competition day (or done)';

		var weeksIn = Math.floor(daysBetween(CHALLENGE.trainingStart, today.toISOString().split('T')[0]) / 7) + 1;

		if (weeksIn <= 3) return 'Phase 1: Hypertrophy Base (Week ' + weeksIn + '/9)';
		if (weeksIn <= 6) return 'Phase 2: Strength (Week ' + weeksIn + '/9)';
		if (weeksIn <= 8) return 'Phase 3: Peak (Week ' + weeksIn + '/9)';
		return 'Phase 4: Taper (Week 9/9)';
	}

	function renderChallengePrep() {
		var section = document.getElementById('challenge-prep');
		if (!section) return;

		// Countdown
		var today = new Date().toISOString().split('T')[0];
		var days = daysBetween(today, CHALLENGE.date);
		document.getElementById('days-remaining').textContent = days >= 0 ? days : 0;

		// Current phase
		document.getElementById('current-phase').textContent = getCurrentPhase();

		// Progress bars
		var best = getBestFromWorkouts();

		function updateBar(event, current) {
			var item = section.querySelector('[data-event="' + event + '"]');
			if (!item) return;
			var baseline = CHALLENGE.baselines[event];
			var target = CHALLENGE.targets[event];
			var range = target - baseline;
			var progress = current - baseline;
			var pct = range > 0 ? Math.max(0, Math.min(100, (progress / range) * 100)) : 0;

			item.querySelector('.current-val').textContent = current;
			item.querySelector('.progress-fill').style.width = pct.toFixed(0) + '%';
			item.querySelector('.progress-percent').textContent = pct.toFixed(0) + '% to target';

			if (current >= target) {
				item.setAttribute('data-complete', 'true');
				item.querySelector('.progress-percent').textContent = 'TARGET HIT';
			}
		}

		updateBar('deadlift', best.deadlift);
		updateBar('bench', best.bench);
		updateBar('pullups', best.pullups);
		updateBar('hang', best.hang);
	}

	// ---- Training Schedule Render ----

	function addDays(dateStr, days) {
		var d = new Date(dateStr);
		d.setDate(d.getDate() + days);
		return d.toISOString().split('T')[0];
	}

	function getWorkoutsByDate() {
		var workouts = getWorkouts();
		var byDate = {};
		for (var i = 0; i < workouts.length; i++) {
			byDate[workouts[i].date] = workouts[i];
		}
		return byDate;
	}

	function renderTrainingSchedule() {
		var container = document.getElementById('schedule-container');
		if (!container) return;
		container.innerHTML = '';

		var today = new Date().toISOString().split('T')[0];
		var workoutsByDate = getWorkoutsByDate();
		var dayOffsets = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

		for (var w = 0; w < TRAINING_PLAN.length; w++) {
			var weekData = TRAINING_PLAN[w];
			var weekEnd = addDays(weekData.start, 6);

			var block = document.createElement('div');
			block.className = 'week-block';
			if (today >= weekData.start && today <= weekEnd) {
				block.className += ' current';
			} else if (today > weekEnd) {
				block.className += ' past';
			}

			var header = document.createElement('div');
			header.className = 'week-header';
			header.innerHTML =
				'<h3 class="week-title">Week ' + weekData.week + ' — ' + formatDate(weekData.start) + '</h3>' +
				'<span class="week-phase">' + escapeHtml(weekData.phase) + '</span>';
			block.appendChild(header);

			var list = document.createElement('div');
			list.className = 'session-list';

			for (var s = 0; s < weekData.sessions.length; s++) {
				var session = weekData.sessions[s];
				var sessionDate = addDays(weekData.start, dayOffsets[session.day]);
				var completed = !!workoutsByDate[sessionDate];

				var card = document.createElement('div');
				card.className = 'session-card' + (completed ? ' completed' : '');

				var exHtml = '';
				for (var e = 0; e < session.exercises.length; e++) {
					exHtml += '<li>' + escapeHtml(session.exercises[e]) + '</li>';
				}

				card.innerHTML =
					'<div class="session-day">' + session.day + ' · ' + formatDate(sessionDate) + '</div>' +
					'<div class="session-name">' + escapeHtml(session.name) + '</div>' +
					'<ul class="session-exercises">' + exHtml + '</ul>' +
					'<span class="session-status">' + (completed ? '✓ Logged' : 'Upcoming') + '</span>';

				list.appendChild(card);
			}

			block.appendChild(list);
			container.appendChild(block);
		}
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

	// ---- Rest Timer ----

	var timerState = {
		interval: null,
		remaining: 120,
		running: false,
		audioCtx: null
	};

	function formatTimerTime(seconds) {
		var m = Math.floor(seconds / 60);
		var s = seconds % 60;
		return m + ':' + (s < 10 ? '0' + s : s);
	}

	function playBeep() {
		try {
			if (!timerState.audioCtx) {
				var AC = window.AudioContext || window.webkitAudioContext;
				if (!AC) return;
				timerState.audioCtx = new AC();
			}
			var ctx = timerState.audioCtx;
			// Three beeps
			for (var i = 0; i < 3; i++) {
				var osc = ctx.createOscillator();
				var gain = ctx.createGain();
				osc.type = 'sine';
				osc.frequency.value = 880;
				gain.gain.value = 0.3;
				osc.connect(gain);
				gain.connect(ctx.destination);
				var startTime = ctx.currentTime + (i * 0.35);
				osc.start(startTime);
				osc.stop(startTime + 0.2);
			}
		} catch (e) { /* ignore */ }
	}

	function vibrate() {
		if (navigator.vibrate) {
			navigator.vibrate([300, 100, 300, 100, 300]);
		}
	}

	function updateTimerDisplay() {
		var el = document.getElementById('timer-time');
		if (el) el.textContent = formatTimerTime(timerState.remaining);
	}

	function startRestTimer(seconds) {
		stopRestTimer();
		timerState.remaining = seconds;
		timerState.running = true;

		var widget = document.getElementById('rest-timer');
		var label = document.getElementById('timer-label');
		widget.className = 'rest-timer-running';
		label.textContent = 'Rest — Go!';

		updateTimerDisplay();

		timerState.interval = setInterval(function() {
			timerState.remaining--;
			updateTimerDisplay();
			if (timerState.remaining <= 0) {
				finishRestTimer();
			}
		}, 1000);
	}

	function finishRestTimer() {
		clearInterval(timerState.interval);
		timerState.interval = null;
		timerState.running = false;
		timerState.remaining = 0;

		var widget = document.getElementById('rest-timer');
		var label = document.getElementById('timer-label');
		widget.className = 'rest-timer-done';
		label.textContent = 'Rest Complete!';
		updateTimerDisplay();

		playBeep();
		vibrate();

		// Auto-reset to idle after 10 seconds
		setTimeout(function() {
			if (!timerState.running) {
				widget.className = 'rest-timer-idle';
				label.textContent = 'Rest Timer';
				timerState.remaining = 120;
				updateTimerDisplay();
			}
		}, 10000);
	}

	function stopRestTimer() {
		if (timerState.interval) {
			clearInterval(timerState.interval);
			timerState.interval = null;
		}
		timerState.running = false;
		timerState.remaining = 120;

		var widget = document.getElementById('rest-timer');
		var label = document.getElementById('timer-label');
		if (widget) {
			widget.className = 'rest-timer-idle';
			label.textContent = 'Rest Timer';
			updateTimerDisplay();
		}
	}

	function initTimer() {
		updateTimerDisplay();
		document.getElementById('timer-start-2').addEventListener('click', function() {
			startRestTimer(120);
		});
		document.getElementById('timer-start-3').addEventListener('click', function() {
			startRestTimer(180);
		});
		document.getElementById('timer-start-90').addEventListener('click', function() {
			startRestTimer(90);
		});
		document.getElementById('timer-stop').addEventListener('click', function() {
			stopRestTimer();
		});

		// Auto-start 2 min timer when user fills in a set (weight + reps)
		document.addEventListener('change', function(e) {
			if (e.target && (e.target.classList.contains('set-weight') || e.target.classList.contains('set-reps'))) {
				var row = e.target.closest('.set-row');
				if (row) {
					var w = row.querySelector('.set-weight').value;
					var r = row.querySelector('.set-reps').value;
					if (w && r) {
						startRestTimer(120);
					}
				}
			}
		});
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

		// Initialize rest timer widget
		initTimer();

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
