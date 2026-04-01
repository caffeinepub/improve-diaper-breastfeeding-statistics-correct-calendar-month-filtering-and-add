import Time "mo:core/Time";
import List "mo:core/List";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Random "mo:core/Random";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import InviteLinksModule "invite-links/invite-links-module";
import Storage "blob-storage/Storage";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let inviteState = InviteLinksModule.initState();

  // ---------- Data Types ----------
  public type ChildProfile = {
    id : Text;
    name : Text;
    birthDate : Int;
    photo : ?Storage.ExternalBlob;
    isPublic : Bool;
    parent : Principal;
    sharedWith : List.List<Principal>;
  };

  public type DiaperLog = {
    childId : Text;
    timestamp : Int;
    contents : {
      kakis : Bool;
      sysius : Bool;
      tuscia : Bool;
    };
  };

  public type BreastfeedingSession = {
    childId : Text;
    startTime : Int;
    duration : Int;
    side : {
      #left;
      #right;
    };
  };

  public type TummyTimeSession = {
    childId : Text;
    startTime : Int;
    duration : Int;
  };

  public type JournalNote = {
    childId : Text;
    text : Text;
    color : NoteColor;
    createdAt : Int;
    updatedAt : Int;
  };

  public type WeightEntry = {
    weightId : Text;
    childId : Text;
    timestamp : Int;
    weight : Float;
  };


  public type MilkPumpingSession = {
    sessionId : Text;
    childId : Text;
    timestamp : Int;
    mlAmount : Float;
    side : { #left; #right; #both };
  };
  public type FeedingSession = {
    sessionId : Text;
    childId : Text;
    timestamp : Int;
    mlAmount : Float;
    feedingType : { #misinukas; #mamosPienas };
  };
  public type ActiveTimerState = {
    childId : Text;
    userId : Principal;
    startTime : Int;
    side : {
      #left;
      #right;
    };
    isPaused : Bool;
    pausedAt : ?Int;
    totalPausedDuration : Int;
  };

  public type TummyTimeTimerState = {
    childId : Text;
    userId : Principal;
    startTime : Int;
    isPaused : Bool;
    pausedAt : ?Int;
    totalPausedDuration : Int;
  };

  public type UserProfile = {
    name : Text;
  };

  public type ChildProfileView = {
    id : Text;
    name : Text;
    birthDate : Int;
    photo : ?Storage.ExternalBlob;
    isPublic : Bool;
    parent : Principal;
    sharedWith : [Principal];
  };

  public type NoteColor = {
    #yellow;
    #pink;
    #blue;
    #green;
    #purple;
  };

  public type ChildInviteLink = {
    inviteCode : Text;
    childId : Text;
    createdBy : Principal;
    createdAt : Int;
    used : Bool;
  };

  // ---------- Persistent State ----------
  stable var persistentChildProfiles = Map.empty<Text, ChildProfile>();
  stable var persistentDiaperLogs = Map.empty<Text, DiaperLog>();
  stable var persistentBreastfeedingSessions = Map.empty<Text, BreastfeedingSession>();
  stable var persistentTummyTimeSessions = Map.empty<Text, TummyTimeSession>();
  stable var persistentJournalNotes = Map.empty<Text, JournalNote>();
  stable var persistentWeightEntries = Map.empty<Text, WeightEntry>();
  stable var persistentMilkPumpingSessions = Map.empty<Text, MilkPumpingSession>();
  stable var persistentFeedingSessions = Map.empty<Text, FeedingSession>();
  stable var persistentUserProfiles = Map.empty<Principal, UserProfile>();
  stable var persistentChildInviteLinks = Map.empty<Text, ChildInviteLink>();
  stable var persistentActiveTimers = Map.empty<Text, ActiveTimerState>();
  stable var persistentTummyTimeTimers = Map.empty<Text, TummyTimeTimerState>();

  // ---------- Helper Functions ----------
  func toChildProfileView(profile : ChildProfile) : ChildProfileView {
    {
      id = profile.id;
      name = profile.name;
      birthDate = profile.birthDate;
      photo = profile.photo;
      isPublic = profile.isPublic;
      parent = profile.parent;
      sharedWith = profile.sharedWith.toArray();
    };
  };

  func toChildProfileViewArray(profiles : List.List<ChildProfile>) : [ChildProfileView] {
    let profileArray = profiles.toArray();
    profileArray.map(func(profile) { toChildProfileView(profile) });
  };

  func hasSharedAccess(child : ChildProfile, user : Principal) : Bool {
    child.sharedWith.filter(func(id) { id == user }).size() > 0;
  };

  func canAccessChild(child : ChildProfile, caller : Principal) : Bool {
    child.parent == caller or hasSharedAccess(child, caller);
  };

  func getLithuanianDayStart(ts : Int) : Int {
    ts;
  };

  func generateUniqueCode() : async Text {
    let blob = await Random.blob();
    InviteLinksModule.generateUUID(blob);
  };

  // ---------- User Profile Management ----------
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali peržiūrėti profilius");
    };
    persistentUserProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Neautorizuota: galima peržiūrėti tik savo profilį");
    };
    persistentUserProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali išsaugoti profilius");
    };
    persistentUserProfiles.add(caller, profile);
  };

  // ---------- Admin Invite Code System (for general app access) ----------
  public shared ({ caller }) func generateInviteCode() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Neautorizuota: tik administratoriai gali generuoti kvietimo kodus");
    };

    let blob = await Random.blob();
    let code = InviteLinksModule.generateUUID(blob);
    InviteLinksModule.generateInviteCode(inviteState, code);
    code;
  };

  public func submitRSVP(name : Text, attending : Bool, inviteCode : Text) : async () {
    // Validate that the invite code exists before allowing RSVP
    let codes = InviteLinksModule.getInviteCodes(inviteState);
    var validCode = false;
    for (code in codes.vals()) {
      if (code.code == inviteCode) {
        validCode := true;
      };
    };
    
    if (not validCode) {
      Runtime.trap("Neteisingas kvietimo kodas");
    };

    // Validate input to prevent abuse
    if (name.isEmpty() or name.size() > 100) {
      Runtime.trap("Neteisingas vardas");
    };

    InviteLinksModule.submitRSVP(inviteState, name, attending, inviteCode);
  };

  public query ({ caller }) func getAllRSVPs() : async [InviteLinksModule.RSVP] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Neautorizuota: tik administratoriai gali peržiūrėti RSVP");
    };

    InviteLinksModule.getAllRSVPs(inviteState);
  };

  public query ({ caller }) func getInviteCodes() : async [InviteLinksModule.InviteCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Neautorizuota: tik administratoriai gali peržiūrėti kvietimo kodus");
    };

    InviteLinksModule.getInviteCodes(inviteState);
  };

  // ---------- Child Management ----------
  public shared ({ caller }) func addChild(name : Text, birthDate : Int, photo : ?Storage.ExternalBlob, isPublic : Bool) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali pridėti vaikus");
    };

    let childId = name # birthDate.toText();
    let childProfile : ChildProfile = {
      id = childId;
      name;
      birthDate;
      photo;
      isPublic;
      parent = caller;
      sharedWith = List.empty<Principal>();
    };
    persistentChildProfiles.add(childId, childProfile);
    childId;
  };

  public shared ({ caller }) func toggleChildVisibility(childId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali keisti matomumą");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (child.parent != caller) {
          Runtime.trap("Neautorizuota: tik tėvai gali keisti vaiko matomumą");
        };
        let updatedChild = {
          id = child.id;
          name = child.name;
          birthDate = child.birthDate;
          photo = child.photo;
          isPublic = not child.isPublic;
          parent = child.parent;
          sharedWith = child.sharedWith;
        };
        persistentChildProfiles.add(childId, updatedChild);
      };
    };
  };

  public query ({ caller }) func getChild(childId : Text) : async ChildProfileView {
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (child.isPublic) { return toChildProfileView(child) };
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
          Runtime.trap("Neautorizuota: reikalinga autentifikacija privatiems profiliams");
        };
        if (child.parent == caller or hasSharedAccess(child, caller)) {
          return toChildProfileView(child);
        } else {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko profilio");
        };
      };
    };
  };

  public query func getAllPublicChildren() : async [ChildProfileView] {
    toChildProfileViewArray(
      List.fromArray(
        persistentChildProfiles.values().toArray().filter(func(c) { c.isPublic })
      )
    );
  };

  public query ({ caller }) func getChildrenByParent(parent : Principal) : async [ChildProfileView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: reikalinga autentifikacija");
    };
    if (parent != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Neautorizuota: galima peržiūrėti tik savo vaikus");
    };
    toChildProfileViewArray(
      List.fromArray(
        persistentChildProfiles.values().toArray().filter(func(c) { c.parent == parent })
      )
    );
  };

  public query ({ caller }) func getSharedChildren() : async [ChildProfileView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: reikalinga autentifikacija");
    };
    toChildProfileViewArray(
      List.fromArray(
        persistentChildProfiles.values().toArray().filter(func(c) { hasSharedAccess(c, caller) })
      )
    );
  };

  public query ({ caller }) func calculateAgeInDays(childId : Text) : async Nat {
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not child.isPublic) {
          if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Neautorizuota: reikalinga autentifikacija privatiems duomenims");
          };
          if (not canAccessChild(child, caller)) {
            Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
          };
        };
        let currentTime = Time.now();
        let timeDelta = currentTime - child.birthDate;
        let days = timeDelta / 86_400_000_000_000;
        days.toNat();
      };
    };
  };

  public shared ({ caller }) func regenerateChildPhoto(childId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali regeneruoti nuotraukas");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) { 
        if (child.parent != caller) { 
          Runtime.trap("Neautorizuota: tik tėvai gali regeneruoti vaiko nuotrauką") 
        } 
      };
    };
  };

  public query ({ caller }) func getChildStatistics(childId : Text) : async {
    totalDiapers : Nat;
    totalBreastfeedingSessions : Nat;
    totalTummyTime : Int;
  } {
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (child.isPublic) {
          let totalDiapers = persistentDiaperLogs.filter(func((_, log)) { log.childId == childId }).size();
          let totalBreastfeedingSessions = persistentBreastfeedingSessions.filter(func((_, session)) { session.childId == childId }).size();
          var totalTummyTime : Int = 0;
          for ((_, session) in persistentTummyTimeSessions.entries()) {
            if (session.childId == childId) {
              totalTummyTime += session.duration;
            };
          };

          return {
            totalDiapers;
            totalBreastfeedingSessions;
            totalTummyTime;
          };
        };
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
          Runtime.trap("Neautorizuota: reikalinga autentifikacija privatiems duomenims");
        };
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };
        let totalDiapers = persistentDiaperLogs.filter(func((_, log)) { log.childId == childId }).size();
        let totalBreastfeedingSessions = persistentBreastfeedingSessions.filter(func((_, session)) { session.childId == childId }).size();
        var totalTummyTime : Int = 0;
        for ((_, session) in persistentTummyTimeSessions.entries()) {
          if (session.childId == childId) {
            totalTummyTime += session.duration;
          };
        };

        return {
          totalDiapers;
          totalBreastfeedingSessions;
          totalTummyTime;
        };
      };
    };
  };

  // ---------- Child Sharing System ----------
  public shared ({ caller }) func generateChildInviteLink(childId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali generuoti kvietimo nuorodas");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (child.parent != caller) {
          Runtime.trap("Neautorizuota: tik tėvai gali generuoti kvietimo nuorodas");
        };

        let inviteCode = await generateUniqueCode();
        let invite : ChildInviteLink = {
          inviteCode;
          childId;
          createdBy = caller;
          createdAt = Time.now();
          used = false;
        };
        persistentChildInviteLinks.add(inviteCode, invite);
        inviteCode;
      };
    };
  };

  public shared ({ caller }) func acceptChildInvite(inviteCode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali priimti kvietimus");
    };

    switch (persistentChildInviteLinks.get(inviteCode)) {
      case (null) { Runtime.trap("Kvietimo kodas nerastas") };
      case (?invite) {
        if (invite.used) {
          Runtime.trap("Kvietimo kodas jau panaudotas");
        };

        switch (persistentChildProfiles.get(invite.childId)) {
          case (null) { Runtime.trap("Vaikas nerastas") };
          case (?child) {
            if (child.parent == caller) {
              Runtime.trap("Negalite priimti kvietimo savo vaikui");
            };

            if (hasSharedAccess(child, caller)) {
              Runtime.trap("Jau turite prieigą prie šio vaiko");
            };

            child.sharedWith.add(caller);
            let updatedChild = {
              id = child.id;
              name = child.name;
              birthDate = child.birthDate;
              photo = child.photo;
              isPublic = child.isPublic;
              parent = child.parent;
              sharedWith = child.sharedWith;
            };
            persistentChildProfiles.add(invite.childId, updatedChild);

            let usedInvite = {
              inviteCode = invite.inviteCode;
              childId = invite.childId;
              createdBy = invite.createdBy;
              createdAt = invite.createdAt;
              used = true;
            };
            persistentChildInviteLinks.add(inviteCode, usedInvite);
          };
        };
      };
    };
  };

  public shared ({ caller }) func shareChildWithUser(childId : Text, userId : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali dalintis vaiko profiliu");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (child.parent != caller) {
          Runtime.trap("Neautorizuota: tik tėvai gali dalintis vaiko profiliu");
        };

        if (child.parent == userId) {
          Runtime.trap("Negalite dalintis su savimi");
        };

        if (hasSharedAccess(child, userId)) {
          Runtime.trap("Naudotojas jau turi prieigą");
        };

        child.sharedWith.add(userId);
        let updatedChild = {
          id = child.id;
          name = child.name;
          birthDate = child.birthDate;
          photo = child.photo;
          isPublic = child.isPublic;
          parent = child.parent;
          sharedWith = child.sharedWith;
        };
        persistentChildProfiles.add(childId, updatedChild);
      };
    };
  };

  public shared ({ caller }) func revokeChildAccess(childId : Text, userId : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali atšaukti prieigą");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (child.parent != caller) {
          Runtime.trap("Neautorizuota: tik tėvai gali atšaukti prieigą");
        };

        let updatedSharedWith = child.sharedWith.filter(func(id) { id != userId });
        let updatedChild = {
          id = child.id;
          name = child.name;
          birthDate = child.birthDate;
          photo = child.photo;
          isPublic = child.isPublic;
          parent = child.parent;
          sharedWith = updatedSharedWith;
        };
        persistentChildProfiles.add(childId, updatedChild);
      };
    };
  };

  public query ({ caller }) func getSharedUsers(childId : Text) : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: reikalinga autentifikacija");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (child.parent != caller) {
          Runtime.trap("Neautorizuota: tik tėvai gali peržiūrėti bendrinamus naudotojus");
        };
        child.sharedWith.toArray();
      };
    };
  };

  // ---------- Diaper Tracking ----------
  public shared ({ caller }) func logDiaperChange(
    childId : Text,
    kakis : Bool,
    sysius : Bool,
    tuscia : Bool
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali registruoti sauskelnių keitimus");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let logId = Time.now().toText();
        let log : DiaperLog = {
          childId;
          timestamp = Time.now();
          contents = {
            kakis;
            sysius;
            tuscia;
          };
        };
        persistentDiaperLogs.add(logId, log);
      };
    };
  };

  public query ({ caller }) func getDiaperLogsForChild(childId : Text) : async [DiaperLog] {
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (child.isPublic) {
          let logs = List.empty<DiaperLog>();
          for ((_, log) in persistentDiaperLogs.entries()) {
            if (log.childId == childId) {
              logs.add(log);
            };
          };
          return logs.toArray();
        };
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
          Runtime.trap("Neautorizuota: reikalinga autentifikacija privatiems duomenims");
        };
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let logs = List.empty<DiaperLog>();
        for ((_, log) in persistentDiaperLogs.entries()) {
          if (log.childId == childId) {
            logs.add(log);
          };
        };
        logs.toArray();
      };
    };
  };

  // ---------- Breastfeeding Tracking ----------
  public shared ({ caller }) func startBreastfeedingSession(
    childId : Text,
    side : { #left; #right }
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali pradėti žindymo seansą");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let timerId = childId # caller.toText();
        let timer : ActiveTimerState = {
          childId;
          userId = caller;
          startTime = Time.now();
          side;
          isPaused = false;
          pausedAt = null;
          totalPausedDuration = 0;
        };
        persistentActiveTimers.add(timerId, timer);
      };
    };
  };

  public shared ({ caller }) func pauseBreastfeedingTimer(childId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali pristabdyti žindymo seansą");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let timerId = childId # caller.toText();
        switch (persistentActiveTimers.get(timerId)) {
          case (null) { Runtime.trap("Aktyvus seansas nerastas") };
          case (?timer) {
            if (timer.isPaused) {
              Runtime.trap("Seansas jau pristabdytas");
            };
            let updatedTimer = {
              childId = timer.childId;
              userId = timer.userId;
              startTime = timer.startTime;
              side = timer.side;
              isPaused = true;
              pausedAt = ?Time.now();
              totalPausedDuration = timer.totalPausedDuration;
            };
            persistentActiveTimers.add(timerId, updatedTimer);
          };
        };
      };
    };
  };

  public shared ({ caller }) func resumeBreastfeedingTimer(childId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali tęsti žindymo seansą");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let timerId = childId # caller.toText();
        switch (persistentActiveTimers.get(timerId)) {
          case (null) { Runtime.trap("Aktyvus seansas nerastas") };
          case (?timer) {
            if (not timer.isPaused) {
              Runtime.trap("Seansas nėra pristabdytas");
            };
            let pauseDuration = switch (timer.pausedAt) {
              case (null) { 0 };
              case (?pausedTime) { Time.now() - pausedTime };
            };
            let updatedTimer = {
              childId = timer.childId;
              userId = timer.userId;
              startTime = timer.startTime;
              side = timer.side;
              isPaused = false;
              pausedAt = null;
              totalPausedDuration = timer.totalPausedDuration + pauseDuration;
            };
            persistentActiveTimers.add(timerId, updatedTimer);
          };
        };
      };
    };
  };

  public shared ({ caller }) func completeBreastfeedingSession(childId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali užbaigti žindymo seansą");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let timerId = childId # caller.toText();
        switch (persistentActiveTimers.get(timerId)) {
          case (null) { Runtime.trap("Aktyvus seansas nerastas") };
          case (?timer) {
            let endTime = Time.now();
            let duration = endTime - timer.startTime - timer.totalPausedDuration;

            let sessionId = endTime.toText();
            let session : BreastfeedingSession = {
              childId;
              startTime = timer.startTime;
              duration;
              side = timer.side;
            };
            persistentBreastfeedingSessions.add(sessionId, session);
            persistentActiveTimers.remove(timerId);
          };
        };
      };
    };
  };

  public query ({ caller }) func getActiveBreastfeedingTimer(childId : Text) : async ?ActiveTimerState {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: reikalinga autentifikacija");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let timerId = childId # caller.toText();
        persistentActiveTimers.get(timerId);
      };
    };
  };

  public query ({ caller }) func getBreastfeedingSessionsForChild(childId : Text) : async [BreastfeedingSession] {
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (child.isPublic) {
          let sessions = List.empty<BreastfeedingSession>();
          for ((_, session) in persistentBreastfeedingSessions.entries()) {
            if (session.childId == childId) {
              sessions.add(session);
            };
          };
          return sessions.toArray();
        };
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
          Runtime.trap("Neautorizuota: reikalinga autentifikacija privatiems duomenims");
        };
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let sessions = List.empty<BreastfeedingSession>();
        for ((_, session) in persistentBreastfeedingSessions.entries()) {
          if (session.childId == childId) {
            sessions.add(session);
          };
        };
        sessions.toArray();
      };
    };
  };

  public shared ({ caller }) func addManualBreastfeedingSession(
    childId : Text,
    date : Int,
    duration : Int,
    side : { #left; #right }
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali pridėti žindymo seansus");
    };

    if (duration <= 0) {
      Runtime.trap("Trukmė turi būti teigiama");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let sessionId = Time.now().toText();
        let normalizedDate = getLithuanianDayStart(date);
        let session : BreastfeedingSession = {
          childId;
          startTime = normalizedDate;
          duration;
          side;
        };
        persistentBreastfeedingSessions.add(sessionId, session);
      };
    };
  };

  // ---------- Tummy Time Tracking ----------
  public shared ({ caller }) func startTummyTimeSession(childId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali pradėti pilvo laiko seansą");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let timerId = childId # caller.toText();
        let timer : TummyTimeTimerState = {
          childId;
          userId = caller;
          startTime = Time.now();
          isPaused = false;
          pausedAt = null;
          totalPausedDuration = 0;
        };
        persistentTummyTimeTimers.add(timerId, timer);
      };
    };
  };

  public shared ({ caller }) func pauseTummyTimeTimer(childId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali pristabdyti pilvo laiko seansą");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let timerId = childId # caller.toText();
        switch (persistentTummyTimeTimers.get(timerId)) {
          case (null) { Runtime.trap("Aktyvus seansas nerastas") };
          case (?timer) {
            if (timer.isPaused) {
              Runtime.trap("Seansas jau pristabdytas");
            };
            let updatedTimer = {
              childId = timer.childId;
              userId = timer.userId;
              startTime = timer.startTime;
              isPaused = true;
              pausedAt = ?Time.now();
              totalPausedDuration = timer.totalPausedDuration;
            };
            persistentTummyTimeTimers.add(timerId, updatedTimer);
          };
        };
      };
    };
  };

  public shared ({ caller }) func resumeTummyTimeTimer(childId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali tęsti pilvo laiko seansą");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let timerId = childId # caller.toText();
        switch (persistentTummyTimeTimers.get(timerId)) {
          case (null) { Runtime.trap("Aktyvus seansas nerastas") };
          case (?timer) {
            if (not timer.isPaused) {
              Runtime.trap("Seansas nėra pristabdytas");
            };
            let pauseDuration = switch (timer.pausedAt) {
              case (null) { 0 };
              case (?pausedTime) { Time.now() - pausedTime };
            };
            let updatedTimer = {
              childId = timer.childId;
              userId = timer.userId;
              startTime = timer.startTime;
              isPaused = false;
              pausedAt = null;
              totalPausedDuration = timer.totalPausedDuration + pauseDuration;
            };
            persistentTummyTimeTimers.add(timerId, updatedTimer);
          };
        };
      };
    };
  };

  public shared ({ caller }) func completeTummyTimeSession(childId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali užbaigti pilvo laiko seansą");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let timerId = childId # caller.toText();
        switch (persistentTummyTimeTimers.get(timerId)) {
          case (null) { Runtime.trap("Aktyvus seansas nerastas") };
          case (?timer) {
            let endTime = Time.now();
            let duration = endTime - timer.startTime - timer.totalPausedDuration;

            let sessionId = endTime.toText();
            let session : TummyTimeSession = {
              childId;
              startTime = timer.startTime;
              duration;
            };
            persistentTummyTimeSessions.add(sessionId, session);
            persistentTummyTimeTimers.remove(timerId);
          };
        };
      };
    };
  };

  public query ({ caller }) func getActiveTummyTimeTimer(childId : Text) : async ?TummyTimeTimerState {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: reikalinga autentifikacija");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let timerId = childId # caller.toText();
        persistentTummyTimeTimers.get(timerId);
      };
    };
  };

  public query ({ caller }) func getTummyTimeSessionsForChild(childId : Text) : async [TummyTimeSession] {
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (child.isPublic) {
          let sessions = List.empty<TummyTimeSession>();
          for ((_, session) in persistentTummyTimeSessions.entries()) {
            if (session.childId == childId) {
              sessions.add(session);
            };
          };
          return sessions.toArray();
        };
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
          Runtime.trap("Neautorizuota: reikalinga autentifikacija privatiems duomenims");
        };
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let sessions = List.empty<TummyTimeSession>();
        for ((_, session) in persistentTummyTimeSessions.entries()) {
          if (session.childId == childId) {
            sessions.add(session);
          };
        };
        sessions.toArray();
      };
    };
  };

  // ---------- Journal (Sticky Notes) ----------
  public shared ({ caller }) func addJournalNote(childId : Text, text : Text, color : NoteColor) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali pridėti užrašus");
    };

    if (text.isEmpty()) {
      Runtime.trap("Tekstas yra privalomas");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let noteId = Time.now().toText();
        let timestamp = Time.now();
        let note : JournalNote = {
          childId;
          text;
          color;
          createdAt = timestamp;
          updatedAt = timestamp;
        };
        persistentJournalNotes.add(noteId, note);
      };
    };
  };

  public query ({ caller }) func getJournalNotesForChild(childId : Text) : async [JournalNote] {
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (child.isPublic) {
          let notes = List.empty<JournalNote>();
          for ((_, note) in persistentJournalNotes.entries()) {
            if (note.childId == childId) {
              notes.add(note);
            };
          };
          return notes.toArray();
        };
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
          Runtime.trap("Neautorizuota: reikalinga autentifikacija privatiems duomenims");
        };
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        let notes = List.empty<JournalNote>();
        for ((_, note) in persistentJournalNotes.entries()) {
          if (note.childId == childId) {
            notes.add(note);
          };
        };
        notes.toArray();
      };
    };
  };

  public shared ({ caller }) func updateJournalNote(childId : Text, noteId : Text, newText : Text, newColor : ?NoteColor) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali atnaujinti užrašus");
    };

    if (newText.isEmpty()) {
      Runtime.trap("Tekstas yra privalomas");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        switch (persistentJournalNotes.get(noteId)) {
          case (null) { Runtime.trap("Užrašas nerastas") };
          case (?note) {
            if (note.childId != childId) {
              Runtime.trap("Užrašas nepriklauso šiam vaikui");
            };
            let updatedNote = {
              childId = note.childId;
              text = newText;
              color = switch (newColor) {
                case (?color) { color };
                case (null) { note.color };
              };
              createdAt = note.createdAt;
              updatedAt = Time.now();
            };
            persistentJournalNotes.add(noteId, updatedNote);
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteJournalNote(childId : Text, noteId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali ištrinti užrašus");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
        };

        switch (persistentJournalNotes.get(noteId)) {
          case (null) { Runtime.trap("Užrašas nerastas") };
          case (?note) {
            if (note.childId != childId) {
              Runtime.trap("Užrašas nepriklauso šiam vaikui");
            };
            persistentJournalNotes.remove(noteId);
          };
        };
      };
    };
  };

  public query ({ caller }) func searchJournalNotes(childId : Text, searchTerm : Text) : async [JournalNote] {
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not child.isPublic) {
          if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Neautorizuota: reikalinga autentifikacija privatiems duomenims");
          };
          if (not canAccessChild(child, caller)) {
            Runtime.trap("Neautorizuota: nėra prieigos prie šio vaiko duomenų");
          };
        };

        if (searchTerm.isEmpty()) {
          let notes = List.empty<JournalNote>();
          for ((_, note) in persistentJournalNotes.entries()) {
            if (note.childId == childId) {
              notes.add(note);
            };
          };
          return notes.toArray();
        };

        let filteredNotes = List.empty<JournalNote>();
        for ((_, note) in persistentJournalNotes.entries()) {
          if (note.childId == childId and note.text.contains(#text searchTerm)) {
            filteredNotes.add(note);
          };
        };

        filteredNotes.toArray();
      };
    };
  };

  // ---------- Weight Tracking ----------
  public shared ({ caller }) func addWeightEntry(
    childId : Text,
    weight : Float,
    timestamp : Int,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali pridėti svorio įrašus");
    };

    if (weight <= 0) {
      Runtime.trap("Svorio reikšmė negali būti nulinė arba mažesnė už nulį");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neturite prieigos prie šio vaiko");
        };
        let weightId = Time.now().toText();
        let entry : WeightEntry = {
          childId = childId;
          weightId = weightId;
          weight = weight;
          timestamp = timestamp;
        };
        persistentWeightEntries.add(weightId, entry);
      };
    };
  };

  public query ({ caller }) func getWeightEntriesForChild(childId : Text) : async [WeightEntry] {
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (child.isPublic) {
          let weightEntries = List.empty<WeightEntry>();
          for ((_, entry) in persistentWeightEntries.entries()) {
            if (entry.childId == childId) {
              weightEntries.add(entry);
            };
          };
          return weightEntries.toArray();
        };
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
          Runtime.trap("Neturite prieigos prie šio vaiko profilio");
        };
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neturite prieigos prie šio vaiko profilio");
        };
        let weightEntries = List.empty<WeightEntry>();
        for ((_, entry) in persistentWeightEntries.entries()) {
          if (entry.childId == childId) {
            weightEntries.add(entry);
          };
        };
        weightEntries.toArray();
      };
    };
  };

  public shared ({ caller }) func updateWeightEntry(
    childId : Text,
    weightId : Text,
    newWeight : Float,
    newTimestamp : Int,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali redaguoti svorio įrašus");
    };

    if (newWeight <= 0) {
      Runtime.trap("Svorio reikšmė negali būti nulinė arba mažesnė už nulį");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neturite prieigos prie šio vaiko");
        };
        switch (persistentWeightEntries.get(weightId)) {
          case (null) { Runtime.trap("Svorio įrašas nerastas") };
          case (?entry) {
            if (entry.childId != childId) {
              Runtime.trap("Svorio įrašas nepriklauso šiam vaikui");
            };
            let updatedEntry = {
              childId = entry.childId;
              weightId = entry.weightId;
              weight = newWeight;
              timestamp = newTimestamp;
            };
            persistentWeightEntries.add(weightId, updatedEntry);
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteWeightEntry(childId : Text, weightId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota: tik naudotojai gali ištrinti svorio įrašus");
    };

    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neturite prieigos prie šio vaiko");
        };
        switch (persistentWeightEntries.get(weightId)) {
          case (null) { Runtime.trap("Svorio įrašas nerastas") };
          case (?entry) {
            if (entry.childId != childId) {
              Runtime.trap("Svorio įrašas nepriklauso šiam vaikui");
            };
            persistentWeightEntries.remove(weightId);
          };
        };
      };
    };
  };

  public shared ({ caller }) func addMilkPumpingSession(
    childId : Text,
    timestamp : Int,
    mlAmount : Float,
    side : { #left; #right; #both },
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota");
    };
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neturite prieigos");
        };
        let blob = await Random.blob();
        let sessionId = InviteLinksModule.generateUUID(blob);
        let session : MilkPumpingSession = {
          sessionId;
          childId;
          timestamp;
          mlAmount;
          side;
        };
        persistentMilkPumpingSessions.add(sessionId, session);
      };
    };
  };

  public query ({ caller }) func getMilkPumpingSessionsForChild(childId : Text) : async [MilkPumpingSession] {
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not child.isPublic) {
          if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Neautorizuota");
          };
          if (not canAccessChild(child, caller)) {
            Runtime.trap("Neturite prieigos");
          };
        };
        let sessions = List.empty<MilkPumpingSession>();
        for ((_, s) in persistentMilkPumpingSessions.entries()) {
          if (s.childId == childId) {
            sessions.add(s);
          };
        };
        sessions.toArray();
      };
    };
  };

  public shared ({ caller }) func deleteMilkPumpingSession(childId : Text, sessionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota");
    };
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neturite prieigos");
        };
        persistentMilkPumpingSessions.remove(sessionId);
      };
    };
  };

  public shared ({ caller }) func addFeedingSession(
    childId : Text,
    timestamp : Int,
    mlAmount : Float,
    feedingType : { #misinukas; #mamosPienas },
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota");
    };
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neturite prieigos");
        };
        let blob = await Random.blob();
        let sessionId = InviteLinksModule.generateUUID(blob);
        let session : FeedingSession = {
          sessionId;
          childId;
          timestamp;
          mlAmount;
          feedingType;
        };
        persistentFeedingSessions.add(sessionId, session);
      };
    };
  };

  public query ({ caller }) func getFeedingSessionsForChild(childId : Text) : async [FeedingSession] {
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not child.isPublic) {
          if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Neautorizuota");
          };
          if (not canAccessChild(child, caller)) {
            Runtime.trap("Neturite prieigos");
          };
        };
        let sessions = List.empty<FeedingSession>();
        for ((_, s) in persistentFeedingSessions.entries()) {
          if (s.childId == childId) {
            sessions.add(s);
          };
        };
        sessions.toArray();
      };
    };
  };

  public shared ({ caller }) func deleteFeedingSession(childId : Text, sessionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Neautorizuota");
    };
    switch (persistentChildProfiles.get(childId)) {
      case (null) { Runtime.trap("Vaikas nerastas") };
      case (?child) {
        if (not canAccessChild(child, caller)) {
          Runtime.trap("Neturite prieigos");
        };
        persistentFeedingSessions.remove(sessionId);
      };
    };
  };
};