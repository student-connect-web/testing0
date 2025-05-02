// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Import necessary Firestore functions
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2U5usc_JDzlfvpWmERxfG1V-tu7gzrvQ",
  authDomain: "student-connect-cf1da.firebaseapp.com",
  projectId: "student-connect-cf1da",
  storageBucket: "student-connect-cf1da.firebasestorage.app",
  messagingSenderId: "565946070237",
  appId: "1:565946070237:web:94eefb528289f0516f9734"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // <--- Initialize Firestore
const auth = getAuth(app);    // <--- Initialize Auth


document.addEventListener('DOMContentLoaded', () => {
  // --- Local Storage Data Models (Keeping for other parts, announcements moved to Firestore) ---
  const DB = {
    // Storage keys (Announcements key is still here but data will be in Firestore)
    KEYS: {
      USERS: 'student_connect_users',
      ANNOUNCEMENTS: 'student_connect_announcements', // Data will be in Firestore now
      MEETINGS: 'student_connect_meetings',
      MESSAGES: 'student_connect_messages',
      LAST_SYNC: 'student_connect_last_sync' // Not strictly needed for announcements with Firestore
    },

    // Initialize the database
    init() {
      // Create users collection if it doesn't exist (in local storage)
      if (!localStorage.getItem(this.KEYS.USERS)) {
        localStorage.setItem(this.KEYS.USERS, JSON.stringify([]));
      }

      // Create meetings collection if it doesn't exist (in local storage)
      if (!localStorage.getItem(this.KEYS.MEETINGS)) {
        localStorage.setItem(this.KEYS.MEETINGS, JSON.stringify([]));
      }

      // Create messages collection if it doesn't exist (in local storage)
      if (!localStorage.getItem(this.KEYS.MESSAGES)) {
        localStorage.setItem(this.KEYS.MESSAGES, JSON.stringify([]));
      }

      // Set last sync time if not exists (Not strictly needed for announcements with Firestore)
      // This might still be useful for other local storage data if you implement syncing for them.
      if (!localStorage.getItem(this.KEYS.LAST_SYNC)) {
        localStorage.setItem(this.KEYS.LAST_SYNC, new Date().toISOString());
      }

      // Add sample data if database is empty (Consider adding sample data to Firestore instead/also)
      // This currently adds sample users to local storage and sample announcements to Firestore.
      this.addSampleData();

      // Setup local storage sync event listeners (Primarily for local storage data)
      // This part can be largely removed or adapted for other local storage data
      this.setupSyncEvents();

      // Setup Firestore listener for announcements for real-time updates across devices
      this.setupAnnouncementsListener();
    },

    // Setup Firestore listener for real-time announcement updates
    setupAnnouncementsListener() {
        const announcementsCollection = collection(db, "announcements");
        // Create a query to order announcements by creation time (newest first)
        const q = query(announcementsCollection, orderBy("createdAt", "desc"));

        // Set up a real-time listener
        onSnapshot(q, (snapshot) => {
            console.log("Announcements updated in Firestore");
            // Map the documents to include their Firestore document ID
            const announcements = snapshot.docs.map(doc => ({
                id: doc.id, // Include the Firestore document ID
                ...doc.data() // Spread the rest of the document data
            }));
            // Update UI with fetched announcements
            renderAnnouncements(announcements);
        }, (error) => {
            console.error("Error listening to announcements:", error);
            showToast("Error loading announcements.", "error");
        });
    },

    // Setup sync event listeners for cross-device/tab communication (Primarily for local storage data)
    setupSyncEvents() {
      // Listen for storage changes from other tabs/windows
      window.addEventListener('storage', (event) => {
        // Only process our app's relevant local storage keys
        // Announcements are now handled by Firestore onSnapshot, so exclude that key here.
        if (event.key === this.KEYS.USERS || event.key === this.KEYS.MEETINGS || event.key === this.KEYS.MESSAGES) {
          console.log(`Local storage changed: ${event.key}`);

          // Add specific logic here to handle updates for other local storage data if needed
          // For example, if meetings or messages are critical to sync across tabs on the same device:
          // if (event.key === this.KEYS.MESSAGES) {
          //   loadChatMessages(currentRoomId); // Assuming currentRoomId is accessible
          // }
          // Note: For announcements, Firestore listener handles this across devices.
        }
      });

      // Periodically check for updates (This is less necessary for announcements with Firestore)
      // Consider if you still need this for other local storage data or remove it.
      // With Firestore onSnapshot, this interval check for announcements is redundant.
      // setInterval(() => {
      //   // This check might be redundant if Firestore is used for critical real-time data like announcements
      //   // checkForUpdates();
      // }, 10000); // Check every 10 seconds
    },

    // Check for updates (simulating server sync) - Less relevant with Firestore
    checkForUpdates() {
      // With Firestore, the onSnapshot listener handles real-time updates.
      // This function might be removed or repurposed.
      console.log('Checking for updates (simulated, using Firestore for announcements)');
      // loadAnnouncements(); // This call is now handled by the onSnapshot listener
    },

    // Add sample data for first-time users
    addSampleData() {
      // Add sample users if none exist (in local storage)
      const users = this.users.getAll();
      if (users.length === 0) {
        try {
          // Add a demo user to local storage
          const demoUser = this.users.create({
            name: 'Demo User',
            email: 'demo@example.com',
            password: 'password123', // In a real app, hash this password
            department: 'computer-science'
          });

          // Add sample announcements to Firestore
          // Check if announcements collection is empty before adding sample data
          getDocs(collection(db, "announcements")).then(snapshot => {
              if (snapshot.empty) {
                  this.announcements.create({
                    question: "What's the meaning of this?",
                    department: 'computer-science',
                    userId: demoUser.id,
                    userName: 'Mahesh'
                  });

                  this.announcements.create({
                    question: "When is the next programming contest?",
                    department: 'computer-science',
                    userId: demoUser.id,
                    userName: 'Priya'
                  });

                  this.announcements.create({
                    question: "Looking for study partners for calculus",
                    department: 'mathematics',
                    userId: demoUser.id,
                    userName: 'Alex'
                  });
              }
          }).catch(error => {
              console.error("Error checking announcements collection:", error);
          });


          // Add sample messages (in local storage)
          this.messages.create({
            text: "Hello! Welcome to Student Connect. How can I help you today?",
            sender: 'assistant',
            roomId: 'welcome'
          });

          this.messages.create({
            text: "You can ask questions, join video calls, or connect with other students here.",
            sender: 'assistant',
            roomId: 'welcome'
          });
        } catch (error) {
          console.error('Error adding sample data:', error);
        }
      }
    },

    // Generate a unique ID that works across devices - Firestore generates IDs
    generateId() {
      // Firestore automatically generates unique IDs for documents.
      // This function might not be needed for documents stored in Firestore.
      console.warn("Using local generateId. Consider using Firestore document IDs where appropriate.");
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    },

    // User methods (using local storage for now)
    users: {
      getAll() {
        return JSON.parse(localStorage.getItem(DB.KEYS.USERS) || '[]');
      },

      getByEmail(email) {
        const users = this.getAll();
        return users.find(user => user.email.toLowerCase() === email.toLowerCase());
      },

      getById(id) {
        const users = this.getAll();
        return users.find(user => user.id === id);
      },

      create(user) {
        const users = this.getAll();
        // Check if user already exists
        if (this.getByEmail(user.email)) {
          throw new Error('User with this email already exists');
        }

        // Add user with ID and timestamps (Using local ID for local storage user for now)
        const newUser = {
          ...user,
          id: DB.generateId(), // Using local ID for local storage user for now
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(DB.KEYS.USERS, JSON.stringify(users));
        return newUser;
      },

      update(id, updates) {
        const users = this.getAll();
        const index = users.findIndex(user => user.id === id);

        if (index === -1) {
          throw new Error('User not found');
        }

        users[index] = {
          ...users[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };

        localStorage.setItem(DB.KEYS.USERS, JSON.stringify(users));
        return users[index];
      }
    },

    // Announcement methods (using Firestore)
    announcements: {
      // This getAll is less used directly with the onSnapshot listener for real-time
      async getAll() {
        const querySnapshot = await getDocs(collection(db, "announcements"));
        return querySnapshot.docs.map(doc => ({
            id: doc.id, // Include the Firestore document ID
            ...doc.data() // Spread the rest of the document data
        }));
      },

      // getById is less common with onSnapshot, but can be implemented if needed
      async getById(id) {
        try {
            const docRef = doc(db, "announcements", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                console.log("No such document!");
                return null;
            }
        } catch (error) {
            console.error("Error getting document:", error);
            throw new Error("Failed to get announcement.");
        }
      },

      // getByDepartment would require a Firestore query
      async getByDepartment(department) {
         console.warn("getByDepartment for announcements not fully implemented with Firestore - requires specific query");
         // Example implementation for filtering by department:
         const announcementsCollection = collection(db, "announcements");
         const q = query(announcementsCollection, where("department", "==", department), orderBy("createdAt", "desc"));
         const querySnapshot = await getDocs(q);
         return querySnapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
         }));
      },

      // Create an announcement in Firestore
      async create(announcement) {
        try {
          // Add announcement to the "announcements" collection in Firestore
          const docRef = await addDoc(collection(db, "announcements"), {
            ...announcement,
            createdAt: new Date().toISOString(), // Store creation date as ISO string
            globalTimestamp: new Date().getTime() // Store a timestamp for consistent sorting across devices
          });
          console.log("Announcement written with ID: ", docRef.id);
          // The onSnapshot listener will automatically update the UI after creation
          return { id: docRef.id, ...announcement }; // Return the new announcement with Firestore ID
        } catch (e) {
          console.error("Error adding document: ", e);
          throw new Error("Failed to post announcement.");
        }
      },

      // Delete an announcement from Firestore
      async delete(id) {
        try {
          // Get a reference to the document by its ID
          const docRef = doc(db, "announcements", id);
          // Delete the document
          await deleteDoc(docRef);
          console.log("Announcement deleted with ID: ", id);
          // The onSnapshot listener will automatically update the UI after deletion
        } catch (e) {
          console.error("Error removing document: ", e);
          throw new Error("Failed to delete announcement.");
        }
      }
    },

    // Meeting methods (using local storage for now)
    meetings: {
      getAll() {
        return JSON.parse(localStorage.getItem(DB.KEYS.MEETINGS) || '[]');
      },

      getByUserId(userId) {
        const meetings = this.getAll();
        return meetings.filter(meeting => meeting.userId === userId);
      },

      getByRoomId(roomId) {
        const meetings = this.getAll();
        return meetings.find(meeting => meeting.roomId === roomId);
      },

      getByAnnouncementId(announcementId) {
        const meetings = this.getAll();
        return meetings.find(meeting => meeting.announcementId === announcementId);
      },

      create(meeting) {
        const meetings = this.getAll();

        // Add meeting with ID and timestamps (using local ID for local storage)
        const newMeeting = {
          ...meeting,
          id: DB.generateId(), // Using local ID for local storage meeting
          createdAt: new Date().toISOString()
        };

        meetings.push(newMeeting);
        localStorage.setItem(DB.KEYS.MEETINGS, JSON.stringify(meetings));
        return newMeeting;
      }
    },

    // Chat messages methods (using local storage for now)
    messages: {
      getAll() {
        return JSON.parse(localStorage.getItem(DB.KEYS.MESSAGES) || '[]');
      },

      getByRoomId(roomId) {
        const messages = this.getAll();
        return messages.filter(message => message.roomId === roomId);
      },

      create(message) {
        const messages = this.getAll();

        // Add message with ID and timestamps (using local ID for local storage)
        const newMessage = {
          ...message,
          id: DB.generateId(), // Using local ID for local storage message
          createdAt: new Date().toISOString()
        };

        messages.push(newMessage);
        localStorage.setItem(DB.KEYS.MESSAGES, JSON.stringify(messages));
        return newMessage;
      }
    }
  };

  // --- Authentication (using local storage for user session for now) ---
  // Note: For a production app, consider using Firebase Authentication for better security and cross-device persistence.
  const Auth = {
    // Current user session
    currentUser: null,

    // Initialize authentication
    init() {
      // Check if user is logged in (from local storage)
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        try {
          this.currentUser = JSON.parse(userSession);
          this.updateUI();
        } catch (error) {
          console.error('Error parsing user session:', error);
          localStorage.removeItem('userSession');
        }
      }
    },

    // Register a new user (using local storage)
    register(userData) {
      try {
        // Validate password
        if (userData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        // Create user in database (local storage)
        const user = DB.users.create({
          name: userData.name,
          email: userData.email,
          // In a real app, you would hash the password
          password: userData.password,
          department: userData.department
        });

        // Remove password from user object for session
        const { password, ...userWithoutPassword } = user;

        // Set current user and save to session (local storage)
        this.currentUser = userWithoutPassword;
        localStorage.setItem('userSession', JSON.stringify(userWithoutPassword));

        this.updateUI();
        return userWithoutPassword;
      } catch (error) {
        throw error;
      }
    },

    // Login user (using local storage)
    login(email, password) {
      try {
        // Find user (in local storage)
        const user = DB.users.getByEmail(email);

        // Check if user exists and password matches (in local storage)
        if (!user || user.password !== password) {
          throw new Error('Invalid email or password');
        }

        // Remove password from user object for session
        const { password: _, ...userWithoutPassword } = user;

        // Set current user and save to session (local storage)
        this.currentUser = userWithoutPassword;
        localStorage.setItem('userSession', JSON.stringify(userWithoutPassword));

        this.updateUI();
        return userWithoutPassword;
      } catch (error) {
        throw error;
      }
    },

    // Logout user (from local storage)
    logout() {
      this.currentUser = null;
      localStorage.removeItem('userSession');
      this.updateUI();
      showSection('home');
    },

    // Check if user is authenticated
    isAuthenticated() {
      return !!this.currentUser;
    },

    // Update UI based on authentication state and user data
    updateUI() {
      const authNavItem = document.getElementById('auth-nav-item');
      const loginNavLink = document.getElementById('login-nav-link');

      if (this.isAuthenticated()) {
        // Update navigation
        if (loginNavLink) {
          loginNavLink.innerHTML = `<i class="fas fa-user"></i> My Profile`;
          loginNavLink.setAttribute('href', '#profile');
        }

        // Update profile page elements
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileDepartment = document.getElementById('profile-department');
        const questionsCount = document.getElementById('questions-count');
        const meetingsCount = document.getElementById('meetings-count');

        if (profileName) profileName.textContent = this.currentUser.name;
        if (profileEmail) profileEmail.textContent = this.currentUser.email;
        if (profileDepartment && this.currentUser.department) {
          profileDepartment.textContent = this.currentUser.department.replace('-', ' ').toUpperCase();
        }

        // Update stats (Announcements count now comes from the currently rendered announcements)
        // We count the visible announcement elements in the UI that belong to the current user.
        // This count will update automatically as the Firestore listener updates the UI.
        if (questionsCount) {
             const userAnnouncementsElements = document.querySelectorAll('.question[data-userid="' + this.currentUser.id + '"]');
             questionsCount.textContent = userAnnouncementsElements.length;
         }


        const userMeetings = DB.meetings.getByUserId(this.currentUser.id); // Meetings still in local storage
        if (meetingsCount) meetingsCount.textContent = userMeetings.length;
      } else {
        // Reset to login state
        if (loginNavLink) {
          loginNavLink.innerHTML = `<i class="fas fa-sign-in-alt"></i> Login`;
          loginNavLink.setAttribute('href', '#login');
        }
         // Clear profile stats when logged out
         const profileName = document.getElementById('profile-name');
         const profileEmail = document.getElementById('profile-email');
         const profileDepartment = document.getElementById('profile-department');
         const questionsCount = document.getElementById('questions-count');
         const meetingsCount = document.getElementById('meetings-count');

         if (profileName) profileName.textContent = '';
         if (profileEmail) profileEmail.textContent = '';
         if (profileDepartment) profileDepartment.textContent = '';
         if (questionsCount) questionsCount.textContent = '0';
         if (meetingsCount) meetingsCount.textContent = '0';
      }
    }
  };

  // --- UI Helpers ---
  // Show toast notification
  function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastMessage || !toastIcon) {
      console.error('Toast elements not found');
      return;
    }

    // Set message
    toastMessage.textContent = message;

    // Set icon based on type
    if (type === 'success') {
      toastIcon.className = 'fas fa-check-circle';
    } else if (type === 'error') {
      toastIcon.className = 'fas fa-exclamation-circle';
    } else {
      toastIcon.className = 'fas fa-info-circle';
    }

    // Show toast
    toast.classList.remove('hidden');

    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  // Format relative time
  function formatRelativeTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  // Generate a random room ID (Still used for meetings)
  function generateRoomId() {
    return Math.random().toString(36).substring(2, 15);
  }

  // Send email (simulated)
  function sendEmail(to, subject, body) {
    console.log(`Sending email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);

    // In a real application, you would use a service like EmailJS, SendGrid, etc.
    // For now, we'll simulate a successful email send
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  }

  // --- Navigation ---
  const navLinks = document.querySelectorAll('nav a');
  const sections = document.querySelectorAll('.section');

  function showSection(sectionId) {
    sections.forEach(section => {
      if (section.id === sectionId) {
        section.classList.add('active');
        // If video call section is active, initialize Jitsi
        if (sectionId === 'video-call') {
          loadJitsiScript();
        }
        // If chat section is active, load messages
        if (sectionId === 'chat') {
          loadChatMessages();
        }
        // If announcements section is active, the onSnapshot listener keeps it updated
        // No explicit loadAnnouncements() call needed here due to real-time listener.
      } else {
        section.classList.remove('active');
      }
    });
  }

  // --- Jitsi Integration ---
  // Load Jitsi API script dynamically
  function loadJitsiScript() {
    if (typeof JitsiMeetExternalAPI !== 'undefined') {
      initializeVideoCall();
      return;
    }

    const jitsiContainer = document.getElementById('jitsi-container');
    if (jitsiContainer) {
      jitsiContainer.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading video call...</p>
        </div>
      `;
    }

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = function() {
      console.log('Jitsi API loaded successfully');
      initializeVideoCall();
    };
    script.onerror = function() {
      console.error('Failed to load Jitsi API');
      if (jitsiContainer) {
        jitsiContainer.innerHTML = `
          <div class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Failed to load video call</h3>
            <p>Please check your internet connection and try again.</p>
            <button onclick="loadJitsiScript()">Retry</button>
          </div>
        `;
      }
    };
    document.body.appendChild(script);
  }

  // Initialize video call
  function initializeVideoCall() {
    const jitsiContainer = document.getElementById('jitsi-container');
    if (!jitsiContainer) return;

    try {
      // Check if we have a room ID in the URL
      let roomId;
      const hash = window.location.hash;
      if (hash.includes('?room=')) {
        roomId = hash.split('?room=')[1];
      } else {
        // Generate a random room ID if none is provided
        roomId = generateRoomId();
      }

      // If we already have an API instance, dispose it
      if (window.jitsiApi) {
        window.jitsiApi.dispose();
      }

      // Create new API instance
      const domain = 'meet.jit.si';
      const options = {
        roomName: roomId,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainer,
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          prejoinPageEnabled: false
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#121212',
          DEFAULT_REMOTE_DISPLAY_NAME: 'Student',
          TOOLBAR_ALWAYS_VISIBLE: true
        }
      };

      window.jitsiApi = new JitsiMeetExternalAPI(domain, options);

      // Add event listeners
      window.jitsiApi.addEventListeners({
        videoConferenceJoined: () => {
          console.log('User joined the conference');
          // Set display name if user is authenticated
          if (Auth.isAuthenticated()) {
            window.jitsiApi.executeCommand('displayName', Auth.currentUser.name);
          }
        },
        videoConferenceLeft: () => {
          console.log('User left the conference');
        },
        participantJoined: (participant) => {
          console.log('Participant joined:', participant);
          showToast(`${participant.displayName || 'A student'} joined the meeting`, 'info');
        }
      });

      // Update UI to show active call
      const videoCallStatus = document.getElementById('video-call-status');
      if (videoCallStatus) {
        videoCallStatus.textContent = 'Call Active';
        videoCallStatus.classList.add('active');
      }

    } catch (error) {
      console.error('Error initializing video call:', error);
      jitsiContainer.innerHTML = `
        <div class="error-container">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Video Call Error</h3>
          <p>${error.message || 'Could not initialize the video call'}</p>
          <button onclick="loadJitsiScript()">Retry</button>
        </div>
      `;
    }
  }

  // End video call
  function endVideoCall() {
    if (window.jitsiApi) {
      window.jitsiApi.executeCommand('hangup');
      window.jitsiApi.dispose();
      window.jitsiApi = null;

      const videoCallStatus = document.getElementById('video-call-status');
      if (videoCallStatus) {
        videoCallStatus.textContent = 'Call Ended';
        videoCallStatus.classList.remove('active');
      }

      showToast('Video call ended', 'info');
    }
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('href').substring(1);

      // Check if user is authenticated for protected sections
      if ((sectionId === 'profile' || sectionId === 'video-call') && !Auth.isAuthenticated()) {
        showSection('login');
        showToast('Please login to access this feature', 'info');
        return;
      }

      showSection(sectionId);

      // Close mobile menu if open
      const navMenu = document.getElementById('nav-menu');
      if (navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) menuToggle.classList.remove('active');
      }
    });
  });

  // --- Mobile Menu ---
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navMenu && menuToggle && !navMenu.contains(e.target) && !menuToggle.contains(e.target) && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
      }
    });
  }

  // --- Feature Cards Navigation ---
  document.querySelectorAll('.feature').forEach(feature => {
    feature.addEventListener('click', () => {
      const sectionId = feature.dataset.section;
      if (sectionId) {
        // Check if user is authenticated for protected sections
        if ((sectionId === 'profile' || sectionId === 'video-call') && !Auth.isAuthenticated()) {
          showSection('login');
          showToast('Please login to access this feature', 'info');
          return;
        }

        showSection(sectionId);
      }
    });
  });

  // --- Authentication UI ---
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginToggle = document.getElementById('login-toggle');
  const registerToggle = document.getElementById('register-toggle');
  const authTitle = document.getElementById('auth-title');

  // Toggle between login and register forms
  if (loginToggle && registerToggle && loginForm && registerForm && authTitle) {
    loginToggle.addEventListener('click', () => {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      loginToggle.classList.add('active');
      registerToggle.classList.remove('active');
      authTitle.textContent = 'Login';
    });

    registerToggle.addEventListener('click', () => {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      loginToggle.classList.remove('active');
      registerToggle.classList.add('active');
      authTitle.textContent = 'Register';
    });

    // Login form submission
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const errorElement = document.getElementById('login-error');

      try {
        Auth.login(email, password);
        showToast('Login successful!', 'success');
        showSection('profile');
        loginForm.reset();
        if (errorElement) errorElement.classList.add('hidden');
      } catch (error) {
        if (errorElement) {
          errorElement.textContent = error.message;
          errorElement.classList.remove('hidden');
        }
      }
    });

    // Register form submission
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const department = document.getElementById('register-department').value;
      const errorElement = document.getElementById('register-error');

      try {
        Auth.register({ name, email, password, department });
        showToast('Registration successful!', 'success');
        showSection('profile');
        registerForm.reset();
        if (errorElement) errorElement.classList.add('hidden');
      } catch (error) {
        if (errorElement) {
          errorElement.textContent = error.message;
          errorElement.classList.remove('hidden');
        }
      }
    });
  }

  // Logout button
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      Auth.logout();
      showToast('Logged out successfully');
    });
  }

  // --- Random Meeting (Post Question) ---
  const postButton = document.getElementById('post-question');
  const questionInput = document.getElementById('random-question');
  const departmentSelect = document.getElementById('department-select');
  const announcementsList = document.getElementById('announcements-list');
  const authWarning = document.getElementById('auth-warning');

  if (postButton && questionInput && departmentSelect) {
    // Made async to await Firestore operations
    postButton.addEventListener('click', async () => {
      // Check if user is authenticated
      if (!Auth.isAuthenticated()) {
        if (authWarning) authWarning.classList.remove('hidden');
        showToast('Please login to post a question.', 'info');
        return;
      }

      if (authWarning) authWarning.classList.add('hidden');
      const question = questionInput.value.trim();
      const department = departmentSelect.value;

      if (question) {
        try {
          // Create announcement in Firestore
          const newAnnouncement = await DB.announcements.create({
            question,
            department,
            userId: Auth.currentUser.id,
            userName: Auth.currentUser.name
          });

          // Create meeting record with reference to the announcement (still in local storage for now)
          // You might consider moving meetings to Firestore as well for full cross-device sync.
          const roomId = generateRoomId();
          const meeting = DB.meetings.create({
            type: 'random',
            question,
            department,
            userId: Auth.currentUser.id,
            roomId,
            announcementId: newAnnouncement.id // Link meeting to Firestore announcement ID
          });

          // Update profile stats (This will be triggered by the onSnapshot listener updating the UI)
          // Auth.updateUI();

          // Reset form and show announcements
          questionInput.value = "";
          showToast('Question posted successfully!', 'success');

          // The onSnapshot listener will automatically update the announcements list.
          // No need to explicitly call loadAnnouncements() or showSection('announcements') here
          // unless you specifically want to navigate to the announcements section after posting.
          // showSection('announcements'); // Uncomment if you want to navigate

          // Offer to join the meeting
          setTimeout(() => {
            if (confirm('Would you like to start a video call for this question now?')) {
              window.location.hash = `video-call?room=${roomId}`;
            }
          }, 1000);
        } catch (error) {
          showToast('Error posting question: ' + error.message, 'error');
        }
      } else {
        showToast('Please enter a question', 'error');
      }
    });
  }

  // Function to render announcements fetched from Firestore
  function renderAnnouncements(announcements) {
      if (!announcementsList) return;

      // Clear existing announcements
      announcementsList.innerHTML = '';

      // Sort announcements by globalTimestamp or createdAt (newest first)
      // Firestore query already orders by createdAt, but this adds a fallback sort
      const sortedAnnouncements = announcements.sort((a, b) => {
          const timeA = a.globalTimestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = b.globalTimestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return timeB - timeA;
      });

      // Add each announcement to UI
      sortedAnnouncements.forEach(announcement => {
          addAnnouncementToUI(announcement);
      });

      // Re-apply current filter after rendering
      const activeFilterButton = document.querySelector('.filter-button.active');
      if (activeFilterButton) {
          applyFilter(activeFilterButton.dataset.filter);
      } else {
          applyFilter('all'); // Default to 'all' if no filter is active
      }

      // Update profile stats to reflect potentially new announcement count
      Auth.updateUI();
  }


  // Function to add a single announcement element to the UI
  function addAnnouncementToUI(announcement) {
    if (!announcementsList) return;

    const questionElement = document.createElement('div');
    questionElement.className = 'question';
    questionElement.dataset.category = announcement.department;
    questionElement.dataset.id = announcement.id; // Use Firestore document ID
    questionElement.dataset.userid = announcement.userId; // Add user ID for profile stats

    questionElement.innerHTML = `
      <h3>${announcement.question}</h3>
      <p>Department: ${announcement.department.replace('-', ' ').toUpperCase()}</p>
      <div class="meta">
        <span>Posted by ${announcement.userName}</span>
        <span>${formatRelativeTime(announcement.createdAt)}</span>
      </div>
      ${Auth.isAuthenticated() && Auth.currentUser.id === announcement.userId ?
        `<button class="delete-announcement" data-id="${announcement.id}">Delete</button>` : ''}
    `;

     // Add click event to join meeting
     questionElement.addEventListener('click', (e) => {
         // Prevent triggering if delete button is clicked
         if (e.target.classList.contains('delete-announcement')) {
             return;
         }

       // Find meeting for this announcement (still in local storage)
       // Note: If you move meetings to Firestore, this lookup would need to change.
       const meeting = DB.meetings.getByAnnouncementId(announcement.id);

       if (meeting) {
         if (Auth.isAuthenticated()) {
           if (confirm('Would you like to join a video call for this question?')) {
             window.location.hash = `video-call?room=${meeting.roomId}`;
           }
         } else {
           showToast('Please login to join the meeting', 'info');
           showSection('login');
         }
       } else {
         // If no meeting exists in local storage for this Firestore announcement,
         // you might offer to create one or just inform the user.
         showToast('No meeting available for this question', 'info');
       }
     });

     // Add event listener for delete button
     const deleteButton = questionElement.querySelector('.delete-announcement');
     if (deleteButton) {
         deleteButton.addEventListener('click', async () => {
             if (confirm('Are you sure you want to delete this announcement?')) {
                 try {
                     await DB.announcements.delete(announcement.id); // Delete from Firestore
                     showToast('Announcement deleted!', 'success');
                     // The onSnapshot listener will automatically remove the element from the UI
                 } catch (error) {
                     showToast('Error deleting announcement: ' + error.message, 'error');
                 }
             }
         });
     }


    // Add the new announcement element to the list
    // The renderAnnouncements function clears and rebuilds the list based on sorted data,
    // so we just append the element here. The sorting is handled before this function is called
    // within renderAnnouncements.
    announcementsList.appendChild(questionElement);
  }

  // --- Announcements Filtering ---
  const filterButtons = document.querySelectorAll('.filter-button');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      applyFilter(button.dataset.filter);
    });
  });

  // Apply filter to the currently displayed announcements
  function applyFilter(filter = 'all') {
    document.querySelectorAll('.question').forEach(question => {
      question.style.display = (filter === 'all' || question.dataset.category === filter)
        ? 'block'
        : 'none';
    });
  }

  // --- Load Announcements --- (This function is now primarily replaced by the onSnapshot listener)
  // Kept as an async function for potential manual use, but the real-time listener is the main mechanism.
  async function loadAnnouncements() {
      console.log("Manually attempting to load announcements (onSnapshot is active)");
      // The onSnapshot listener in DB.init() calls renderAnnouncements when data changes.
      // Calling this manually might not be necessary or could lead to redundant fetches
      // if the onSnapshot listener is already active.
       try {
           const announcements = await DB.announcements.getAll(); // Get all from Firestore (one-time fetch)
           renderAnnouncements(announcements); // Render the fetched data
       } catch (error) {
           console.error("Error loading announcements:", error);
           showToast("Error loading announcements.", "error");
       }
  }


  // --- Invite Meeting (using local storage for meeting records) ---
  const generateInviteButton = document.getElementById('generate-invite-meeting');
  const inviteEmailInput = document.getElementById('invite-email');
  const inviteLinkContainer = document.getElementById('invite-link-container');
  const inviteLinkInput = document.getElementById('invite-link');
  const copyInviteLinkButton = document.getElementById('copy-invite-link');
  const inviteAuthWarning = document.getElementById('invite-auth-warning');
  const sendInviteButton = document.getElementById('send-invite');

  if (generateInviteButton && inviteEmailInput) {
    generateInviteButton.addEventListener('click', () => {
      // Check if user is authenticated
      if (!Auth.isAuthenticated()) {
        if (inviteAuthWarning) inviteAuthWarning.classList.remove('hidden');
         showToast('Please login to generate an invite.', 'info');
        return;
      }

      if (inviteAuthWarning) inviteAuthWarning.classList.add('hidden');
      const emails = inviteEmailInput.value.trim();

      if (emails) {
        try {
          // Generate room ID
          const roomId = generateRoomId();

          // Create meeting record (in local storage)
          // Consider moving meetings to Firestore for cross-device sync.
          DB.meetings.create({
            type: 'invite',
            invitedEmails: emails.split(',').map(email => email.trim()),
            userId: Auth.currentUser.id,
            roomId
          });

          // Update profile stats (for meetings count, which is still local storage)
          Auth.updateUI();

          // Generate and show invite link
          if (inviteLinkInput && inviteLinkContainer) {
            const inviteLink = `${window.location.origin}${window.location.pathname}#video-call?room=${roomId}`;
            inviteLinkInput.value = inviteLink;
            inviteLinkContainer.classList.remove('hidden');

            // Show send invite button if it exists
            if (sendInviteButton) {
              sendInviteButton.classList.remove('hidden');
            }
          }

          showToast('Invite link generated!', 'success');
        } catch (error) {
          showToast('Error generating invite: ' + error.message, 'error');
        }
      } else {
        showToast('Please enter at least one email address', 'error');
      }
    });
  }

  // Send invite email
  if (sendInviteButton) {
    sendInviteButton.addEventListener('click', async () => {
      const emails = inviteEmailInput.value.trim();
      const inviteLink = inviteLinkInput.value;

      if (!emails || !inviteLink) {
        showToast('Missing email or invite link', 'error');
        return;
      }

      try {
        sendInviteButton.disabled = true;
        sendInviteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        const emailList = emails.split(',').map(email => email.trim());
        const subject = `${Auth.currentUser.name} invited you to a Student Connect meeting`;
        const body = `
          Hello,

          ${Auth.currentUser.name} has invited you to join a Student Connect video meeting.

          Click the link below to join:
          ${inviteLink}

          This is an automated message from Student Connect.
        `;

        // Send emails (simulated)
        await Promise.all(emailList.map(email => sendEmail(email, subject, body)));

        showToast('Invites sent successfully!', 'success');
      } catch (error) {
        showToast('Error sending invites: ' + error.message, 'error');
      } finally {
        sendInviteButton.disabled = false;
        sendInviteButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Invites';
      }
    });
  }

  // Copy invite link to clipboard
  if (copyInviteLinkButton && inviteLinkInput) {
    copyInviteLinkButton.addEventListener('click', () => {
      inviteLinkInput.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          showToast('Link copied to clipboard!', 'success');
        } else {
          // Fallback for modern browsers
          navigator.clipboard.writeText(inviteLinkInput.value)
            .then(() => showToast('Link copied to clipboard!', 'success'))
            .catch(err => showToast('Failed to copy: ' + err, 'error'));
        }
      } catch (err) {
        showToast('Failed to copy: ' + err, 'error');
      }
    });
  }

  // --- Chat Messages (using local storage for now) ---
  // Consider moving chat messages to Firestore for cross-device sync.
  const chatInput = document.getElementById('chat-input');
  const sendChatButton = document.getElementById('send-chat');
  const chatMessages = document.getElementById('chat-messages');
  let currentRoomId = 'welcome'; // Default room ID

  // Load chat messages (from local storage)
  function loadChatMessages(roomId = 'welcome') {
    if (!chatMessages) return;

    // Set current room ID
    currentRoomId = roomId;

    // Clear existing messages
    chatMessages.innerHTML = '';

    // Get messages for this room (from local storage)
    const messages = DB.messages.getByRoomId(roomId);

    // Add messages to UI
    messages.forEach(message => {
      addMessageToUI(message);
    });

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add assistant messages if this is a new conversation
    if (messages.length === 0 && roomId === 'welcome') {
      setTimeout(() => {
        addAssistantMessage('Hello! Welcome to Student Connect. How can I help you today?');
      }, 1000);

      setTimeout(() => {
        addAssistantMessage('You can ask questions, join video calls, or connect with other students here.');
      }, 3000);
    }
  }

  // Add message to UI
  function addMessageToUI(message) {
    if (!chatMessages) return;

    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${message.sender === 'user' ? 'sent' : 'received'}`;
    messageElement.textContent = message.text;

    // Add to chat
    chatMessages.appendChild(messageElement);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Add user message (to local storage)
  function addUserMessage(text) {
    // Create message in database (local storage)
    const message = DB.messages.create({
      text,
      sender: 'user',
      roomId: currentRoomId
    });

    // Add to UI
    addMessageToUI(message);

    // Return the message
    return message;
  }

  // Add assistant message (to local storage)
  function addAssistantMessage(text) {
    // Create message in database (local storage)
    const message = DB.messages.create({
      text,
      sender: 'assistant',
      roomId: currentRoomId
    });

    // Add to UI
    addMessageToUI(message);

    // Return the message
    return message;
  }

  // Predefined assistant responses
  const assistantResponses = [
    "How can I help you with your studies today?",
    "Do you need help with any specific subject?",
    "Would you like to connect with other students in your department?",
    "You can post questions in the announcements section to find study partners.",
    "Need a quick video call with a classmate? Try the invite meeting feature!",
    "Don't forget to check the announcements section for updates from your peers.",
    "Is there anything specific you'd like to know about Student Connect?",
    "Remember, you can join video calls directly from the announcements page."
  ];

  // Get random assistant response
  function getRandomAssistantResponse() {
    const index = Math.floor(Math.random() * assistantResponses.length);
    return assistantResponses[index];
  }

  if (sendChatButton && chatInput && chatMessages) {
    sendChatButton.addEventListener('click', () => {
      const message = chatInput.value.trim();
      if (message) {
        // Add user message
        addUserMessage(message);

        // Clear input
        chatInput.value = '';

        // Simulate assistant response after a delay
        setTimeout(() => {
          addAssistantMessage(getRandomAssistantResponse());
        }, 1000);
      }
    });

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendChatButton.click();
        e.preventDefault(); // Prevent form submission
      }
    });
  }

  // --- Toast Close Button ---
  const toastCloseButton = document.getElementById('toast-close');
  const toast = document.getElementById('toast');

  if (toastCloseButton && toast) {
    toastCloseButton.addEventListener('click', () => {
      toast.classList.add('hidden');
    });
  }

  // --- Check URL for room parameter ---
  function checkUrlForRoom() {
    const hash = window.location.hash;
    if (hash.includes('?room=')) {
      const roomId = hash.split('?room=')[1];
      showSection('video-call');

      // Load Jitsi script if not already loaded
      loadJitsiScript();
    }
  }

  // --- Handle browser back/forward navigation ---
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash) {
      const sectionId = hash.substring(1).split('?')[0];
      showSection(sectionId);

      // Check if it's a room link
      checkUrlForRoom();
    } else {
      showSection('home');
    }
  });

  // --- Initialize ---
  function init() {
    try {
      // Initialize database (local storage parts) and setup Firestore listener for announcements
      DB.init();

      // Initialize authentication (local storage session)
      Auth.init();

      // The Firestore listener in DB.init() calls renderAnnouncements initially and on updates.
      // No need to call loadAnnouncements() here directly.

      // Check URL for room parameter
      checkUrlForRoom();

      // Show section based on hash or default to home
      if (!window.location.hash || window.location.hash === '#') {
        showSection('home');
      } else {
        const sectionId = window.location.hash.substring(1).split('?')[0];
        showSection(sectionId);
      }

      // Add active class to menu toggle for mobile
      if (menuToggle) {
        menuToggle.addEventListener('click', function() {
          this.classList.toggle('active');
        });
      }

      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Error initializing application:', error);
      showToast('Error initializing application. Please refresh the page.', 'error');
    }
  }

  // Initialize the application
  init();
});

// Add CSS for loading spinner and error container (existing)
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #fff;
    }

    .loading-spinner {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 4px solid var(--primary-color);
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #fff;
      text-align: center;
      padding: 2rem;
    }

    .error-container i {
      font-size: 3rem;
      color: var(--warning-color);
      margin-bottom: 1rem;
    }

    .error-container button {
      margin-top: 1rem;
      background-color: var(--primary-color);
      color: #fff;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
    }

    #video-call-status {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      background-color: #333;
      color: #fff;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    #video-call-status.active {
      background-color: var(--success-color);
    }

    .question {
      cursor: pointer;
      transition: transform 0.2s ease;
      position: relative; /* Needed for positioning the delete button */
    }

    .question:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .question::after {
      content: "Click to join meeting";
      display: block;
      font-size: 0.8rem;
      color: var(--primary-color);
      margin-top: 0.5rem;
      text-align: right;
    }

    .delete-announcement {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: #f44336; /* Red color */
        color: white;
        border: none;
        border-radius: 50%; /* Make it round */
        width: 25px;
        height: 25px;
        font-size: 0.8rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1; /* Adjust line height for centering */
        opacity: 0.7;
        transition: opacity 0.3s ease;
    }

    .delete-announcement:hover {
        opacity: 1;
        background-color: #d32f2f; /* Darker red on hover */
    }
  `;
  document.head.appendChild(style);
});

// Make sure Jitsi API is loaded
window.addEventListener('load', () => {
  // Check if we're on the video call page
  if (window.location.hash.includes('#video-call')) {
    // Load Jitsi script if not already loaded
    if (typeof JitsiMeetExternalAPI === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }
});
