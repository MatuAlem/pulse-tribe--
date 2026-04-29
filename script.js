// ===== PULSE TRIBE — script.js =====

// ===== ONBOARDING =====
let currentStep = 1;
let userData = { weight: '70', height: '175', age: '25', gender: 'Male', goal: 'Build Muscle' };

function nextStep(n) {
  document.getElementById('step' + currentStep).style.display = 'none';

  // Mark previous step as done
  const prev = document.getElementById('sc' + currentStep);
  prev.classList.remove('active');
  prev.classList.add('done');
  prev.textContent = '✓';
  document.getElementById('sl' + currentStep).classList.remove('active');
  if (currentStep < 5) document.getElementById('line' + currentStep).classList.add('done');

  currentStep = n;
  document.getElementById('step' + n).style.display = 'block';

  const cur = document.getElementById('sc' + n);
  cur.classList.add('active');
  document.getElementById('sl' + n).classList.add('active');

  if (n === 5) buildSummary();
}

function selectGender(btn, val) {
  document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  userData.gender = val;
}

function toggleTag(btn) {
  btn.classList.toggle('selected');
}

function selectGoal(card) {
  document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  userData.goal = card.querySelector('h4').textContent;
}

let injuryShowing = false;
function toggleInjury() {
  injuryShowing = !injuryShowing;
  const state = document.getElementById('injState');
  const tags = document.getElementById('injTags');
  if (injuryShowing) {
    state.className = 'injury-state';
    state.innerHTML = '<div class="inj-icon">⚠️</div><div class="inj-title">Select your injuries below</div><div class="inj-change">No injuries after all</div>';
    tags.style.display = 'block';
  } else {
    state.className = 'injury-state good';
    state.innerHTML = '<div class="inj-icon">✅</div><div class="inj-title" style="color:var(--green)">Great! No injuries to report.</div><div class="inj-change">Change my answer</div>';
    tags.style.display = 'none';
  }
}

function buildSummary() {
  userData.weight = document.getElementById('weight').value || '70';
  userData.height = document.getElementById('height').value || '175';
  userData.age = document.getElementById('age').value || '25';
  document.getElementById('profileSummary').innerHTML =
    `Weight: ${userData.weight} kg<br>Height: ${userData.height} cm<br>Age: ${userData.age}<br>Gender: ${userData.gender}<br>Goal: ${userData.goal}`;
}

function launchApp() {
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  // Populate profile page with onboarding data
  document.getElementById('pWeight').textContent = userData.weight + ' kg';
  document.getElementById('pHeight').textContent = userData.height + ' cm';
  document.getElementById('pAge').textContent = userData.age;
  document.getElementById('pGender').textContent = userData.gender;
  document.getElementById('pGoal').textContent = userData.goal;
}

// ===== APP NAVIGATION =====
let currentPage = 'workouts';

function navTo(section, btn) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const pageMap = {
    home: 'workouts',
    feed: 'feed',
    community: 'community',
    chat: 'chat',
    notif: 'notif',
    profile: 'userprofile'
  };
  if (pageMap[section]) {
    switchPage(pageMap[section], null);
  }
}

function switchPage(page, sbBtn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.sb-btn').forEach(b => b.classList.remove('active'));
  if (sbBtn) document.getElementById(sbBtn).classList.add('active');
  currentPage = page;
}

// ===== NUTRITION CHAT =====
let pendingCalories = 0;

function sendMeal() {
  const input = document.getElementById('mealInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  const msgs = document.getElementById('chatMsgs');
  msgs.innerHTML += `<div class="msg user"><div class="msg-bubble">${msg}</div></div>`;

  // Simulate calorie lookup
  const cal = Math.floor(Math.random() * 300) + 50;
  pendingCalories = cal;

  setTimeout(() => {
    msgs.innerHTML += `<div class="msg bot"><div class="msg-bubble">I found:<br>· ${msg} — <strong>${cal} cal</strong></div></div>`;
    msgs.scrollTop = msgs.scrollHeight;
    document.getElementById('logBtnArea').innerHTML =
      `<button class="log-btn" onclick="logCalories(${cal})">✓ Log ${cal} cal</button>`;
  }, 700);

  msgs.scrollTop = msgs.scrollHeight;
}

function logCalories(cal) {
  document.getElementById('logBtnArea').innerHTML = '';
  const msgs = document.getElementById('chatMsgs');
  msgs.innerHTML += `<div class="msg bot"><div class="msg-bubble" style="background:rgba(46,204,113,0.15); border:1px solid rgba(46,204,113,0.2);">✅ Logged ${cal} calories successfully!</div></div>`;
  msgs.scrollTop = msgs.scrollHeight;
}

function refreshPlan() {
  const btn = document.querySelector('.refresh-btn');
  btn.textContent = '⏳';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = '🔄';
    btn.disabled = false;
  }, 1200);
}

// ===== AI CHAT =====
const aiResponses = [
  "Based on your goal to build muscle, I recommend focusing on compound lifts like squats, deadlifts, and bench press 3-4x per week. 💪",
  "For optimal recovery, aim for 7-9 hours of sleep and consider adding 20-40g of protein within 30 minutes post-workout.",
  "Your current consistency is 0%. Let's change that — start with just 3 sessions this week and build from there! 🔥",
  "For your body weight and goal, a caloric surplus of 200-300 calories above maintenance will support muscle growth without excess fat gain.",
  "Great question! Progressive overload is the key to continuous muscle growth. Try adding 5% more weight or 1-2 reps each week."
];
let aiIdx = 0;

function sendAI() {
  const input = document.getElementById('aiInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  const msgs = document.getElementById('aiChatMsgs');
  msgs.innerHTML += `<div class="msg user"><div class="msg-bubble">${msg}</div></div>`;
  msgs.innerHTML += `<div class="msg bot" id="aiTyping"><div class="msg-bubble"><span class="loading"></span></div></div>`;
  msgs.scrollTop = msgs.scrollHeight;

  setTimeout(() => {
    const typing = document.getElementById('aiTyping');
    if (typing) typing.innerHTML = `<div class="msg-bubble">${aiResponses[aiIdx % aiResponses.length]}</div>`;
    aiIdx++;
    msgs.scrollTop = msgs.scrollHeight;
  }, 900);
}

// ===== SOCIAL FEED =====
function submitPost() {
  const text = document.getElementById('postText').value.trim();
  if (!text) return;
  const feed = document.getElementById('feedPosts');
  feed.insertAdjacentHTML('afterbegin', `
    <div class="feed-post">
      <div class="post-meta">
        <div class="post-avatar">👤</div>
        <div class="info"><h4>You</h4><p>Just now</p></div>
      </div>
      <div class="post-body">${text}</div>
      <div class="post-actions">
        <button class="post-action">❤️ 0</button>
        <button class="post-action">💬 0 Comments</button>
        <button class="post-action">↗ Share</button>
      </div>
    </div>
  `);
  document.getElementById('postText').value = '';
}

// ===== FILTER TABS =====
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
});
