/* 

<!-- The core Firebase JS SDK is always required and must be listed first -->
<script src="https://www.gstatic.com/firebasejs/7.16.1/firebase-app.js"></script>

<!-- TODO: Add SDKs for Firebase products that you want to use
     https://firebase.google.com/docs/web/setup#available-libraries -->
<script src="https://www.gstatic.com/firebasejs/7.16.1/firebase-analytics.js"></script> 

*/

// with ES Modules (if using client-side JS, like React)
import firebase from 'firebase/app';
import 'firebase/firestore';

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyCtZ4gP2Hn-Vff28rlZCZnTs6IaclccDb4",
    authDomain: "guitar-studies.firebaseapp.com",
    databaseURL: "https://guitar-studies.firebaseio.com",
    projectId: "guitar-studies",
    storageBucket: "guitar-studies.appspot.com",
    messagingSenderId: "588458119297",
    appId: "1:588458119297:web:e5457e4d26b5fc149dfd80",
    measurementId: "G-W6XZ2NM3QZ"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
/*   firebase.analytics(); */

  export default firebase;