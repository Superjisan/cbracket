app.service('invite', function(){
  var domainKeys = {
    'www.codersbracket.com': '32EWR3P5QM6ZMUUPH7KR',
    '127.0.0.1': 'JXBNGAWVNQDV3N8PQU2Y',
    'localhost': 'Q67TJEGRKLJQHHEUYZXM'
  };

  this.domainKey = domainKeys[window.location.hostname] || domainKeys['www.codersbracket.com'];

  this.getEmails = function(contacts) {
    return _.map(contacts, function(contact){
      return contact.primaryEmail();
    });
  };

  this.init = function(cb) {
    var self = this;

    cloudsponge.init({
      domain_key: this.domainKey,
      afterSubmitContacts: function(contacts, source, owner) {
        var emails = self.getEmails(contacts);
        cb(emails);
      }
    });
  };
});