import "./login.scss";
import template from './login.html';

import firebase from 'firebase';

const operationType = {
    LOGIN: 'LOGIN',
    REGISTER: 'REGISTER'
}

export default class Login {

    constructor(app) {

        this.app = app;

        document.getElementById('loading-container').classList.add('hide');

        this.body = document.getElementById('content');
        this.body.innerHTML = `${template}`;

        this.title = document.getElementById('login-msg');
        this.switchModeBtn = document.getElementById('register-msg');
        this.enterBtn = document.getElementsByClassName("login-enter-btn")[0];
        this.enterGoogleBtn = document.getElementsByClassName("login-enter-google-btn")[0]
        this.enterFacebookBtn = document.getElementsByClassName("login-enter-facebook-btn")[0]

        this.form = document.getElementById('form');
        this.email = document.getElementById('email');
        this.password = document.getElementById('password');

        // EVENTS
        this.switchModeBtn.addEventListener('click', this.switchMode.bind(this));
        this.enterBtn.addEventListener('click', this.enter.bind(this));
        this.enterGoogleBtn.addEventListener('click', this.enterGoogle.bind(this));
        this.enterFacebookBtn.addEventListener('click', this.enterFacebook.bind(this));

        this.mode = operationType.REGISTER
        this.loading = false;
        this.switchMode();  // default is login...
    }

    switchMode () {
        // removing error style if present
        Array.from(document.getElementsByClassName("form-control")).forEach(control => {
            control.classList.remove('error');
        });
        this.mode = this.mode === operationType.LOGIN ? operationType.REGISTER : operationType.LOGIN;
        if (this.mode === operationType.LOGIN) {
            this.title.innerHTML = 'Login &#127928;';
            this.enterBtn.textContent = 'Log in!'
            this.enterGoogleBtn.style.display = 'block';
            this.enterFacebookBtn.style.display = 'block';
            this.switchModeBtn.style.display = 'block';
            this.switchModeBtn.textContent = 'New here?  Create a new account!';
        } else {
            this.title.innerHTML = 'Register &#127928;';
            this.enterBtn.textContent = 'Enter the family'
            this.enterGoogleBtn.style.display = 'none';
            this.enterFacebookBtn.style.display = 'none';
            this.switchModeBtn.style.display = 'block';
            this.switchModeBtn.textContent = 'Already a member? Log in!';
        }
    }

    validateForm (callback) {
        let required = this.checkRequired([this.email, this.password]);
        let length = this.checkLength(this.password, 6, 25);
        let email = this.checkEmail(this.email);
        if (!required && length && email) {
            console.log('valid form...');
            callback();
        }
    }

    enter () {
        this.loading = true;
        this.validateForm(() => {
            firebase
                .auth()
                .signInWithEmailAndPassword(this.email.value, this.password.value)
                .then(user => {
                    console.log('User; ', user);
                    this.loading = false;
                    this.app.authenticated = true;
                    this.app.user = user;
                    this.app.goTo('list');
                })
                .catch(err => {
                    this.loading = false;
                    this.error = err.message;
                });
        });
    }

    enterGoogle () {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase
            .auth()
            .signInWithPopup(provider)
            .then(data => {
                console.log('User in login page: ', data.user, data.credential.accessToken);
                this.app.authenticated = true;
                this.app.user = data.user;
                this.app.goTo('list');
            })
            .catch(err => {
                this.error = err.message;
            });
    }

    enterFacebook () {
        const provider = new firebase.auth.FacebookAuthProvider();
        firebase
            .auth()
            .signInWithPopup(provider)
            .then(data => {
                console.log('User in login page: ', data.user, data.credential.accessToken);
                this.app.authenticated = true;
                this.app.user = data.user;
                this.app.goTo('list');
            })
            .catch(err => {
                this.error = err.message;
            });
    }

    // Show input error message
    showError (input, message) {
        const formControl = input.parentElement;
        formControl.className = 'form-control error';
        const small = formControl.querySelector('small');
        small.innerText = message;
    }

    // Show success outline
    showSuccess (input) {
        const formControl = input.parentElement;
        formControl.className = 'form-control success';
    }

    // Check email is valid
    checkEmail (input) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (re.test(input.value.trim())) {
            this.showSuccess(input);
            return true;
        } else {
            this.showError(input, 'Email is not valid');
            return false;
        }
    }

    // Check required fields
    checkRequired (inputArr) {
        let isRequired = false;
        for (let i = 0; i < inputArr.length; i++) {
            const input = inputArr[i];
            if (input.value.trim() === '') {
                this.showError(input, `${this.getFieldName(input)} is required`);
                isRequired = true;
                break;
            } else {
                this.showSuccess(input);
            }
        }
        return isRequired;
    }

    // Check input length
    checkLength (input, min, max) {
        if (input.value.length < min) {
            this.showError(
                input,
                `${this.getFieldName(input)} must be at least ${min} characters`
            );
            return false;
        } else if (input.value.length > max) {
            this.showError(
                input,
                `${this.getFieldName(input)} must be less than ${max} characters`
            );
            return false;
        } else {
            this.showSuccess(input);
            return true;
        }
    }

    // Get fieldname
    getFieldName (input) {
        return input.id.charAt(0).toUpperCase() + input.id.slice(1);
    }

}
