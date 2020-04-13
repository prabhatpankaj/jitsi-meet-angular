import { Component, OnInit } from '@angular/core';
declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'jitsi-meet-angular';
  jitsi: any;

  constructor() {
    this.jitsi = (window as any).JitsiMeetJS;
  }


  role = 'user';

  conferenceId = 'prabhatpankaj';
  conferencePassword = 'pass1234';


  wait = (seconds) => new Promise(res => setTimeout(res, seconds * 1000));


  optionsJitsi = {
    hosts: {
      domain: 'beta.meet.jit.si',
      muc: 'conference.beta.meet.jit.si'
    },
    bosh: 'https://beta.meet.jit.si/http-bind',

    clientNode: 'https://jitsi.org/jitsimeet'
  };

  confOptions = {
    openBridgeChannel: true
  };

  initOptions = {
    disableAudioLevels: true,
    desktopSharingChromeExtId: null,
    desktopSharingChromeDisabled: false,
    desktopSharingChromeSources: ['screen', 'window', 'tab'],
    desktopSharingChromeMinExtVersion: '0.1',
  };

  connection = null;
  isJoined = false;
  room = null;
  isVideo: boolean = true;

  localTracks = [];
  remoteTracks = {};

  onLocalTracks(tracks) {
    this.localTracks = tracks;
    for (let i = 0; i < this.localTracks.length; i++) {
      this.localTracks[i].addEventListener(
        this.jitsi.events.track.TRACK_AUDIO_LEVEL_CHANGED,
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
      if (this.isJoined) {
        this.room.addTrack(this.localTracks[i]);
      }
    }
  }


  onRemoteTrack(track) {
    if (track.isLocal()) {
      return;
    }
    const participant = track.getParticipantId();
    const displayName = this.room.getParticipantById(participant).getDisplayName();
    if (displayName &&
      displayName !== 'presenter') {
      return;
    }

    if (!this.remoteTracks[participant]) {
      this.remoteTracks[participant] = [];
    }
    const idx = this.remoteTracks[participant].push(track);

    track.addEventListener(
      this.jitsi.events.track.TRACK_AUDIO_LEVEL_CHANGED,
      audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
    track.addEventListener(
      this.jitsi.events.track.TRACK_MUTE_CHANGED,
      () => console.log('remote track muted'));
    track.addEventListener(
      this.jitsi.events.track.LOCAL_TRACK_STOPPED,
      () => console.log('remote track stoped'));
    track.addEventListener(this.jitsi.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
      deviceId =>
        console.log(
          `track audio output device was changed to ${deviceId}`));

    const divId = participant + track.getType() + idx;

    if (track.getType() === 'video') {
      const width = displayName === 'presenter' ? 300 : 100;
      const videoDiv = `
        <div class='${participant}'>
          <div style="font-size: 100px;">
            Remote video from ${displayName}
          </div>
          <video style="width: ${width}px;" autoplay='1' id='${divId}' />
        </div>
      `;
      $('body').append(videoDiv);
    } else {
      $('body').append(
        `<audio autoplay='1' id='${divId}' />`);
    }

    track.attach($(`#${divId}`)[0]);
  }

  onConferenceJoined() {
    console.log('conference joined!');
    this.isJoined = true;
    for (let i = 0; i < this.localTracks.length; i++) {
      this.room.addTrack(this.localTracks[i]);
    }
  }


  onUserLeft(id) {
    console.log('user left');
    if (!this.remoteTracks[id]) {
      return;
    }
    const tracks = this.remoteTracks[id];

    for (let i = 0; i < tracks.length; i++) {
      tracks[i].detach($(`#${id}${tracks[i].getType()}`));
    }
  }

  onConnectionSuccess = async () => {
    this.room = this.connection.initJitsiConference(this.conferenceId, this.confOptions);
    this.room.setDisplayName(this.role);
    this.room.on(this.jitsi.events.conference.TRACK_ADDED, this.onRemoteTrack);
    this.room.on(this.jitsi.events.conference.TRACK_REMOVED, track => {
      const participant = track.getParticipantId();
      $(`.${participant}`).remove();
      console.log(`track removed!!!${track}`);
    });
    this.room.on(
      this.jitsi.events.conference.CONFERENCE_JOINED,
      this.onConferenceJoined);
    this.room.on(this.jitsi.events.conference.USER_JOINED, (id, user) => {
      console.log('user join', id, user.getDisplayName());
      this.remoteTracks[id] = [];
    });
    this.room.on(this.jitsi.events.conference.USER_LEFT, this.onUserLeft);
    this.room.on(this.jitsi.events.conference.TRACK_MUTE_CHANGED, track => {
      console.log(`${track.getType()} - ${track.isMuted()}`);
    });
    this.room.on(
      this.jitsi.events.conference.DISPLAY_NAME_CHANGED,
      (userID, displayName) => console.log(`${userID} - ${displayName}`));
    this.room.on(
      this.jitsi.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
      (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
    this.room.on(
      this.jitsi.events.conference.PHONE_NUMBER_CHANGED,
      () => console.log(`${this.room.getPhoneNumber()} - ${this.room.getPhonePin()}`));
    this.room.join(this.conferencePassword);
    await this.wait(2);
    if (this.role === 'presenter') {
      this.room.lock(this.conferencePassword);
    }
  }

  onConnectionFailed() {
    console.error('Connection Failed!');
  }

  onDeviceListChanged(devices) {
    console.info('current devices', devices);
  }

  disconnect() {
    console.log('disconnect!');
    if (!this.connection) {
      return;
    }
    this.connection.removeEventListener(
      this.jitsi.events.connection.CONNECTION_ESTABLISHED,
      this.onConnectionSuccess);
    this.connection.removeEventListener(
      this.jitsi.events.connection.CONNECTION_FAILED,
      this.onConnectionFailed);
    this.connection.removeEventListener(
      this.jitsi.events.connection.CONNECTION_DISCONNECTED,
      this.disconnect);
  }

  unload() {
    for (let i = 0; i < this.localTracks.length; i++) {
      this.localTracks[i].dispose();
    }
    this.localTracks = [];
    if (this.room) {
      this.room.leave();
      this.room = null;
    }

    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
    }
    this.remoteTracks = {};
    this.isJoined = false;
  }

  switchVideo() {
    this.isVideo = !this.isVideo;
    if (this.localTracks[1]) {
      this.localTracks[1].dispose();
      this.localTracks.pop();
    }
    this.jitsi.createLocalTracks({
      devices: [this.isVideo ? 'video' : 'desktop']
    })
      .then(tracks => {
        this.localTracks.push(tracks[0]);
        this.localTracks[1].addEventListener(
          this.jitsi.events.track.TRACK_MUTE_CHANGED,
          () => console.log('local track muted'));
        this.localTracks[1].addEventListener(
          this.jitsi.events.track.LOCAL_TRACK_STOPPED,
          () => console.log('local track stoped'));
        this.localTracks[1].attach($('#localVideo1')[0]);
        this.room.addTrack(this.localTracks[1]);
      })
      .catch(error => {
        console.log(error);
      });
  }

  changeAudioOutput(selected) {
    this.jitsi.mediaDevices.setAudioOutputDevice(selected.value);
  }

  startAsPresenter = async () => {
    console.log('Start as presenter');
    this.role = 'presenter';
    await this.wait(1);
    this.main();
  }

  startAsUser = async () => {
    console.log('Start as user');
    this.role = 'user';
    await this.wait(1);
    this.main();
  }


  main = async () => {
    $(window).bind('beforeunload', this.unload);
    $(window).bind('unload', this.unload);

    this.jitsi.init(this.initOptions);
    this.jitsi.setLogLevel(this.jitsi.logLevels.ERROR);

    await this.wait(1);

    this.connection = new this.jitsi.JitsiConnection(null, null, this.optionsJitsi);

    this.connection.addEventListener(
      this.jitsi.events.connection.CONNECTION_ESTABLISHED,
      this.onConnectionSuccess);
    this.connection.addEventListener(
      this.jitsi.events.connection.CONNECTION_FAILED,
      this.onConnectionFailed);
    this.connection.addEventListener(
      this.jitsi.events.connection.CONNECTION_DISCONNECTED,
      this.disconnect);

    this.jitsi.mediaDevices.addEventListener(
      this.jitsi.events.mediaDevices.DEVICE_LIST_CHANGED,
      this.onDeviceListChanged);

    this.connection.connect();

    $('#login').remove();

    if (this.role !== 'presenter') {
      $('#controls').remove();
      return;
    }

    const tracks = await this.jitsi.createLocalTracks({ devices: ['audio', 'video'] });
    this.onLocalTracks(tracks);

    if (this.jitsi.mediaDevices.isDeviceChangeAvailable('output')) {
      this.jitsi.mediaDevices.enumerateDevices(devices => {
        const audioOutputDevices
          = devices.filter(d => d.kind === 'audiooutput');

        if (audioOutputDevices.length > 1) {
          $('#audioOutputSelect').html(
            audioOutputDevices
              .map(
                d =>
                  `<option value="${d.deviceId}">${d.label}</option>`)
              .join('\n'));

          $('#audioOutputSelectWrapper').show();
        }
      });
    }
  }

  ngOnInit() {

  }
}
