import { Component, OnInit } from '@angular/core';
declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'jitsi-meet-angular';
  private jitsi: any;
  private connection: any;
  private room: any;

  constructor() {
    this.jitsi = (window as any).JitsiMeetJS;
  }


  private initOptions = {
    disableAudioLevels: true,

    desktopSharingChromeExtId: null,
  
    desktopSharingChromeDisabled: false,
  
    desktopSharingChromeSources: ['screen', 'window', 'tab'],
  
    desktopSharingChromeMinExtVersion: '0.1'

  };

  private confOptions = {
    openBridgeChannel: true
  }

  private options = {
    hosts: {
      domain: 'beta.meet.jit.si',
      muc: 'conference.beta.meet.jit.si' // FIXME: use XEP-0030
    },
    bosh: 'https://beta.meet.jit.si/http-bind', // FIXME: use xep-0156 for that
  
    // The name of client node advertised in XEP-0115 'c' stanza
    clientNode: 'http://jitsi.org/jitsimeet'
  };

  role = 'user';
  localTracks = [];

  private createConnection(options): any {
    return new this.jitsi.JitsiConnection(null, null, options);
  }

  private setConnectionListeners(connection: any): void {
    connection.addEventListener(this.jitsi.events.connection.CONNECTION_ESTABLISHED, this.onConnectionSuccess);
    connection.addEventListener(this.jitsi.events.connection.CONNECTION_FAILED, this.onConnectionFailed);
    connection.addEventListener(this.jitsi.events.connection.CONNECTION_DISCONNECTED, this.disconnect);
    this.jitsi.mediaDevices.addEventListener(this.jitsi.events.mediaDevices.DEVICE_LIST_CHANGED, this.onDeviceListChanged);
    connection.connect();
  }

  private createRoom(connection: any, options: any) : void {
    this.room = connection.initJitsiConference('conference', options);
  }

  private setRoomListeners(room: any): void {
    room.on(this.jitsi.events.conference.TRACK_ADDED, this.onRemoteTrack);
    room.on(this.jitsi.events.conference.CONFERENCE_JOINED, this.onConferenceJoined);
  }

  private onConnectionSuccess(): void {
    console.log("onConnectionSuccess");
  }

  private onConnectionFailed(): void {
    console.log("onConnectionFailed");
  }

  private disconnect(): void {
    console.log('disconnecting?');
  }

  private onRemoteTrack(): void {
    console.log("onRemoteTrack");
  }

  private onConferenceJoined(): void {
    console.log("onConferenceJoined");
  }

  private onDeviceListChanged(devices): void {
    console.info('current devices', devices);
  }

  startAsPresenter() {
    this.role = 'presenter';
    this.initializeVideo();
  }

  startAsUser() {
    console.log("here")
  }

  quitConference() {
    console.log("here")
  }

  switchVideo() {
    console.log("here")
  }

  changeAudioOutput() {
    console.log("here")
  }

  onLocalTracks(tracks) {
    this.localTracks = tracks;
    for (let i = 0; i < this.localTracks.length; i++) {
      this.localTracks[i].addEventListener(this.jitsi.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        audioLevel => console.log(`Audio Level local: ${audioLevel}`));
      this.localTracks[i].addEventListener(
        this.jitsi.events.track.TRACK_MUTE_CHANGED,
        () => console.log('local track muted'));
      this.localTracks[i].addEventListener(
        this.jitsi.events.track.LOCAL_TRACK_STOPPED,
        () => console.log('local track stoped'));
      this.localTracks[i].addEventListener(
        this.jitsi.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
        deviceId =>
          console.log(
            `track audio output device was changed to ${deviceId}`));
      if (this.localTracks[i].getType() === 'video') {
        $('body').append(`
          <div>
            <div>
              <b style="font-size: 100px;">I'm ${this.role}<b>
            </div>
            <video style="width: 600px;" autoplay='1' id='localVideo${i}' />
          </div>
        `);
        this.localTracks[i].attach($(`#localVideo${i}`)[0]);
      } else {
        $('body').append(
          `<audio autoplay='1' muted='true' id='localAudio${i}' />`);
        this.localTracks[i].attach($(`#localAudio${i}`)[0]);
      }
    }
  }
  

  async initializeVideo() {
    this.jitsi.init(this.initOptions);
    this.jitsi.setLogLevel(this.jitsi.logLevels.ERROR);
    this.connection = this.createConnection(this.options);
    this.setConnectionListeners(this.connection);

    const tracks = await this.jitsi.createLocalTracks({ devices: ['audio', 'video'] });
    this.onLocalTracks(tracks);
  }

  // initializeVideo() {
  //   this.jitsi.init(this.initOptions);
  //   this.jitsi.setLogLevel(this.jitsi.logLevels.ERROR);
  //   this.connection = this.createConnection(this.options);
  //   this.setConnectionListeners(this.connection);
  //   this.createRoom(this.connection, this.confOptions);
  //   this.setRoomListeners(this.room);
  //   this.room.join();
  // }

  ngOnInit() {

  }
}