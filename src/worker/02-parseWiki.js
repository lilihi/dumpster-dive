const wtf = require('wtf_wikipedia');
const chalk = require('chalk');
const encode = require('./_encode');

//doesn't support fancy things like &copy; to ©, etc
const escapeXML = function(str) {
  return str
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
};

//get parsed json from the wiki markup
const parseWiki = function(page, options, worker) {
  try {
    page.wiki = escapeXML(page.wiki || '');
    // options.title = options.title || page.title
    const doc = wtf(page.wiki, options);
      let media_medium = (doc.infobox() || {})._type;
      let medias = ['film']
      if (options.only_media === true && !medias.includes(media_medium)){
        return null;
      }
    //dont insert this if it's a redirect
    if (options.skip_redirects === true && doc.isRedirect()) {
      worker.counts.redirects += 1;
      if (options.verbose_skip === true) {
        console.log(
          chalk.green('skipping redirect:   -   ') + chalk.yellow('"' + page.title + '"')
        );
      }
      return null;
    }
    if (options.skip_disambig === true && doc.isDisambiguation()) {
      worker.counts.disambig += 1;
      if (options.verbose_skip === true) {
        console.log(
          chalk.green('skipping disambiguation: ') + chalk.yellow('"' + page.title + '"')
        );
      }
      return null;
    }
    //add-in the proper xml page-title
    doc.title(page.title);
    //turn the wtf_wikipedia document into storable json
    let data = {};
    if (!options.custom) {
      //default format
      data = doc.json(options);
    } else {
      //DIY format
      data = options.custom(doc);
    }
    //use the title/pageID from the xml
    data.title = data.title || page.title;
    data.pageID = data.pageID || page.pageID;
    data._id = data._id || data.title;
    data._id = encode.encodeStr(data._id);
    data.media_medium = media_medium;
    //create a fallback id, if none is found
    if (!data._id || data._id === true) {
      delete data._id;
    }
    return data;
  } catch (e) {
    console.log(chalk.red('\n---Error on "' + page.title + '"'));
    console.log(e);
    return null;
  }
};

module.exports = parseWiki;
