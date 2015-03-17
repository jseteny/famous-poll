Players = new Mongo.Collection("players");

function findPlayer(fragment, skp) {
    return Players.findOne(
        {
            "name": {
                $regex: new RegExp(".*" + fragment + ".*"), $options: 'i'
            }
        }
        ,
        {
            skip: skp
        }
    );
}

/*
 any code that’s placed within a folder
 named “client” will only run on the client.
 As a demonstration:
 1. Create a folder named “client” inside your project’s folder.
 2. Create a JavaScript file inside this new folder. You can name it whatever you like.
 3. Cut and paste all of the client-side code from the leaderboard.js into the new file, but
 without the isClient conditional.
 After saving the file, the application continues to work as expected.

 any code placed within a folder
 named “server” will only run on the server.

 Files stored in a private folder will only be accessible to code that’s executed on the server.
 The files will never be accessible by users.
 • Files stored in a public folder are served to visitors. These are files like images, favicons,
 and the robots.txt file.
 • Files stored in a lib folder are loaded before all other files.
 */
if (Meteor.isClient) {
    var skp = 0;
    var lmt = 8;
    var player;
    Session.set("neve", "");
    Meteor.subscribe("players", Session.get("neve"), skp, lmt);

    Template.leaderboard.helpers({
        people: function () {
            return Players.find(
                {
                    "name": {
                        $regex: new RegExp(".*" + Session.get("neve") + ".*"), $options: 'i'
                    }
                }
                ,
                {
                    sort: {score: -1, name: 1}, skip: Session.get("skip"), limit: lmt
                }
            );
        },
        selectedName: function () {
            var player = Players.findOne(Session.get("selectedPlayer"));
            return player && player.name;
        }
    });

    Template.search.events({
        'input #name': function () {
            skp = 0;
            Session.set("skip", 0);
            var fragment = $('#name').val();
            Session.set("neve", fragment);
            Meteor.subscribe("players", Session.get("neve"), skp, lmt);
            player = findPlayer(fragment, skp);
            if (player) {
                Session.set("selectedPlayer", player._id);
            }
        },
        'keydown #name': function (e) {
            // 40 le
            if (e.which == 40) {
                ++skp;
                Meteor.subscribe("players", Session.get("neve"), skp, lmt);
                Session.set("skip", skp);
                player = findPlayer(fragment, skp);
                if (player) {
                    Session.set("selectedPlayer", player._id);
                }
            }

            // 38 fel
            if (e.which == 38 && skp > 0) {
                --skp;
                Meteor.subscribe("players", Session.get("neve"), skp, lmt);
                Session.set("skip", skp);
                player = findPlayer(fragment, skp);
                if (player) {
                    Session.set("selectedPlayer", player._id);
                }
            }
        }
    });

    Template.leaderboard.events({
        'click .inc': function () {
            Players.update(Session.get("selectedPlayer"), {$inc: {score: 1}});
        }
    });

    Template.person.helpers({
        selected: function () {
            return Session.equals("selectedPlayer", this._id) ? "selected" : '';
        }
    });

    Template.person.events({
        'click': function () {
            Session.set("selectedPlayer", this._id);
        }
    });
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
    Meteor.startup(function () {
        if (Players.find().count() === 0) {
            var names = [
                "Hazslinszky-Krull Géza", "Platthy József", "Némethy Bertalan", "Endrődy Ágoston"
                , "Martin Luther King", "Kalkuttai Teréz Anya"
                , "Sípos István", "Sípos Ete Álmos"
                , "Lechner Ödön", "Csete György"
                , "Noam Chomsky"
                , "Claude Lelouch", "Alexandre Arcady"
            ];

            _.each(names, function (name) {
                Players.insert({
                    name: name,
                    score: Math.floor(Random.fraction() * 10) * 5
                });
            });
        }

        Meteor.publish("players", function (fragment, skp, lmt) {

            //http://ilearnasigoalong.blogspot.hu/2013/10/efficient-techniques-for-fuzzy-and.html
            console.log("fragment: " + fragment);

            return Players.find(
                {
                    "name": {
                        $regex: new RegExp(".*" + fragment + ".*"), $options: 'i'
                    }
                }
                ,
                {
                    sort: {score: -1, name: 1}, skip: skp, limit: lmt
                }
            );
        });
    });
}
