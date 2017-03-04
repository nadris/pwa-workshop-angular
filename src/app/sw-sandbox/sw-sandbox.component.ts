import { Component, OnInit } from '@angular/core';
import { NgServiceWorker } from '@angular/service-worker';
import 'isomorphic-fetch';

declare var fetch;

@Component({
  selector: 'app-sw-sandbox',
  templateUrl: './sw-sandbox.component.html',
  styleUrls: ['./sw-sandbox.component.css'],
  providers: [NgServiceWorker]
})
export class SwSandboxComponent implements OnInit {

  private swScope: string = './';
  private swUrl: string = './worker-basic.min.js';

  constructor(public sw: NgServiceWorker) {
  }

  ngOnInit() {
    this.sw.log().subscribe(message => console.log(message));
  }

  checkServiceWorker(): void {

    navigator['serviceWorker']
      .getRegistrations()
      .then(registrations => {
        return registrations
          .map(reg => {
            return {
              scope: reg.scope,
              active: !!reg.active,
              installing: !!reg.installing,
              waiting: !!reg.waiting
            };
          })
      })
      .then(value => JSON.stringify(value))
      .then(value => {
        console.log(value);
      })
  }

  forceUpdate(): void {

    this
      .sw
      .checkForUpdate()
      .subscribe(res => {
        console.log(JSON.stringify(res));
      });

  }

  pingCompanion(): void {

    this
      .sw
      .ping()
      .subscribe(undefined, undefined, () => {
        console.log('pong');
      });

  }

  loadCacheKeys(): void {
    let caches = window['caches'];
    caches.keys().then(keys => console.log(JSON.stringify(keys)));
  }

  installWorker(): void {

    navigator['serviceWorker']
      .register(this.swUrl, { scope: this.swScope })
      .then(registration => {

        console.log('Service Worker registered. Registration: ', registration)

        return registration;

      })

      .catch(error => {
        console.log("There was a problem with the Service Worker", error);
      });
  }


  uninstallWorker(): void {

    navigator['serviceWorker']
      .getRegistration(this.swScope)
      .then(registration => {

        registration.unregister().then(function (boolean) {

          console.log(boolean ? 'Service Worker unregister is successful' : 'Service Worker unregister is unsuccessful')

        });

      })
      .catch(error => {
        console.log(error);
      })

  }

  subscribeToPush() {

    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    const vapidPublicKey = 'BHe82datFpiOOT0k3D4pieGt1GU-xx8brPjBj0b22gvmwl-HLD1vBOP1AxlDKtwYUQiS9S-SDVGYe_TdZrYJLw8';
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    navigator['serviceWorker']
      .getRegistration(this.swScope)
      .then(registration => {

        registration.pushManager
          .subscribe({ userVisibleOnly: true, applicationServerKey: convertedVapidKey })
          .then(function (subscription) {
            return fetch("https://pwa-workshop-api.herokuapp.com/webpush", { //https://pwa-workshop-api.herokuapp.com VS http://localhost:3000
              method: "POST",
              body: JSON.stringify({ action: 'subscribe', subscription: subscription }),
              headers: { 'Content-Type': 'application/json' }
            })
              .then(response => {
                return response.json()
              })
              .then(json => {
                console.log('Subscription request answer', json)
              })
              .catch(error => {
                console.log('Subscription request failed', error)
              });
          });

      })
      .catch(error => {
        console.log(error);
      })

  }

  unsubscribeFromPush() {

    navigator['serviceWorker']
      .getRegistration(this.swScope)
      .then(registration => {

        registration.pushManager.getSubscription().then(function (subscription) {
          subscription.unsubscribe().then(success => {
            console.log('Unsubscription successful', success)
          }).catch(error => {
            console.log('Unsubscription failed', error)
          })
        })

      })
      .catch(error => {
        console.log(error);
      })

  }

  registerForPush(): void {

    this
      .sw
      .registerForPush()
      .subscribe(handler => {
        console.log(JSON.stringify({
          url: handler.url,
          key: handler.key(),
          auth: handler.auth()
        }));
      });

    this
      .sw
      .push
      .map(value => JSON.stringify(value))
      .subscribe(value => {
        console.log(value)
      });

  }


}
