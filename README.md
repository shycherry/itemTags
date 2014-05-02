# itemTags

Web Frontend that help users to manage their itemsDBs.

Example:

{
  "uuid_conf_1",
  "@hidden" : "",
  "@viewConfig" : {
    "hiddenTags" : ["viewConfig", "hidden" ,"file"],
    "hiddenItems" : ["hidden"]
  }
}
// item##uuid_conf_1 won't be showed

{
  "uuid" : "uuid_item_1",
  "@file" : {
    "uri" : "ftp://user:mdp@host/Videos/Series/Breaking Bad/Saison 3/Breaking.Bad.S03E10.Fly.DVDRip.XviD-aAF.avi"
  }
  "@Video" : "",
  "@Serie" : "",
  "@Breaking Bad" : "",
  "@Saison 3" : "",
}

// tags for item#uuid_item_1 : ['file', 'Video', 'Serie', 'Breaking Bad', 'Saison 3']
// tags displayed for item#uuid_item_1 : ['Video', 'Serie', 'Breaking Bad', 'Saison 3']
