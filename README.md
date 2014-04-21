# itemTags

Web Frontend that help users to manage their itemsDBs.


conventions : 
  tags prefixed by '_' shouldn't be displayed to user
  items not tagged by '_showable' shouldn't be displayed to user

Example: Breaking Bad Saison 3 Episode 10

{
  "uuid" : "uuid_item_1",
  "_file" : "uuid_file_1",
  "_showable" : "",
  "Video" : "",
  "Serie" : "",
  "Breaking Bad" : "",
  "Saison 3" : "",
}
// tags for item#uuid_item_1 : ['_file', 'Video', 'Serie', 'Breaking Bad', 'Saison 3']
// tags displayed for item#uuid_item_1 : ['Video', 'Serie', 'Breaking Bad', 'Saison 3']

{
  "uuid" : "uuid_file_1",
  "_uri" : "ftp://user:mdp@host/Videos/Series/Breaking Bad/Saison 3/Breaking.Bad.S03E10.Fly.DVDRip.XviD-aAF.avi",
}
// tags for item#uuid_file_1 : ['_uri']
