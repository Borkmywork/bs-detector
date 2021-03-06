var data = [];
    shorts = [];
    toExpand = '';
    expanded = {};

function async(thisFunc, callback) {
  setTimeout(function() {
      thisFunc;
      if (callback) {callback();}
  }, 10);
}

chrome.runtime.sendMessage(null, {"operation": "passData"}, null, function(state) {
  data = state.sites;
  shorts = state.shorteners;
});

chrome.extension.sendMessage({}, function(response) {
    var readyStateCheckInterval = setInterval(function() {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);

            function expandLinks() {
              $.each(shorts, function() {
                var shortLink = 'a[href*="' + this + '"]';
                $(shortLink).each(function() {
                  var theLink = ($(this).attr('href'));
                  if (!toExpand) {
                    toExpand = theLink;
                  } else {
                    toExpand = toExpand + '***' + theLink;
                  }
                });
              });
              if (toExpand !='') {
                chrome.runtime.sendMessage(null, {"operation": "expandLink", "shortLink": toExpand}, null, function(response) {
                  expanded = JSON.parse(response.expandedLinks);
                  $.each(expanded, function(short, long) {
                    $('a[href="' + short + '"]').attr('longurl', long);
                  });
                });
              }
            }

            function linkWarning() {
              $.each(data, function() {
                var badLink = '[href*="' + this.url + '"],[data-expanded-url*="' + this.url +'"],[longurl*="' + this.url +'"]';
                var classType = '';
                switch (this.type) {
                  case '':
                    classType = 'Classification Pending';
                    break;
                  case 'bias':
                    classType = 'Extreme Bias';
                    break;
                  case 'conspiracy':
                    classType = 'Conspiracy Theory';
                    break;
                  case 'fake':
                    classType = 'Fake News';
                    break;
                  case 'junksci':
                    classType = 'Junk Science';
                    break;
                  case 'satire':
                    classType = 'Satire';
                    break;
                  case 'state':
                    classType = 'State News Source';
                    break;
                  case 'hate':
                    classType = 'Hate Group';
                    break;
                }
                var warnMessage = '💩 This website is not a reliable news source. Reason: ' + classType;

                $(badLink).each(function() {
                  if (window.location.hostname == 'www.facebook.com') {
                    if ($(this).parents('.UFICommentContent').length == 1) {
                      badLinkWrapper = $(this).closest('.UFICommentBody');
                      if (!badLinkWrapper.hasClass('fFlagged')) {
                        badLinkWrapper.after('<div class="bsAlert">' + warnMessage + '</div>');
                        badLinkWrapper.addClass('fFlagged');
                      }
                    }
                    if ($(this).parents('.userContent').length == 1) {
                      badLinkWrapper = $(this).closest('.userContent');
                      if (!badLinkWrapper.hasClass('fFlagged')) {
                        badLinkWrapper.before('<div class="bsAlert">' + warnMessage + '</div>');
                        badLinkWrapper.addClass('fFlagged');
                      }
                    }
                  } else {
                    $(this).addClass("hint--error hint--large hint--bottom");
                    $(this).attr('aria-label', warnMessage);
                  }
                });
              });
            }

            function watchPage() {
              var mutationObserver = new MutationObserver(function() {
                trigger();
              });
              var targetNode = document.body;
              var observerConfig = {
                childList: true,
                subtree: true
              };
              mutationObserver.observe(targetNode, observerConfig);
            }

            function trigger() {
              async(expandLinks(), function() {
                linkWarning();
              });
            }

            trigger();
            watchPage();
          }
    }, 3);
});
