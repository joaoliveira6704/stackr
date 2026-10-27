// jsdom has no layout, so the router's scroll to top on navigation would only
// print "Not implemented" warnings.
window.scrollTo = () => {};
