var setupAceEditor = function () {
  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/textmate");
  // editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode("ace/mode/javascript");
  editor.setHighlightActiveLine(false);
  editor.setShowPrintMargin(false);
  editor.renderer.setShowGutter(false);
  editor.commands.addCommands([{
      name: "no_line_number_popup",
      bindKey: {
          win: "Ctrl-L",
          mac: "Command-L"
      },
      exec: function(editor, line) {
          return false;
      },
      readOnly: true
  }]);

  editor.getSession().on('change', function(e) {
    localStorage.setItem("code", editor.getValue());
  });
  return editor;
};

var setupEvents = function () {

  $(window).load(function () {
    var getImgBottom = function () {
      var front_buttons_bottom = $('#front_buttons').offset().top + $('#front_buttons').height();
      var image_bottom = $(window).height() - $('#text-editor-animate').height() - front_buttons_bottom - 70;
      return image_bottom;
    };

    var image_bottom = getImgBottom();
    $('#text-editor-animate').animate({
      bottom: image_bottom + "px"
    }, 1000);

    $(window).resize(function () {
      var image_bottom = getImgBottom()+15;
      $('#text-editor-animate').css('bottom', image_bottom + "px");
    });
  });


  $('#waitlist_form').submit(function(e){
    var email = $('#email').val();
    if (!!email) {
      $.post('/waitlist', {
        email: email
      }, function(data, textStatus, jqXHR) {
        $('#waitlist_form').fadeOut(400,function() {
          $('#thanks').fadeIn();
        });
      });
    }
    e.preventDefault();
    return false;
  });
};

var setupLayoutEvents = function() {
  $('#fssig').hover(function(e) {
    $('#sig_start_message').animate({
      left: "-204px"
    }, 400);
  }, function(e){
    $('#sig_start_message').animate({
      left: "0px"
    }, 400, function () {
      // $('#sig_start_message').css('left', "10px");
    });
  });

  $(function(){
    var path = window.location.pathname;
    $('nav li a[href="'+path+'"]').parents('li').addClass('active');
  });
};

var expandBracket = function () {
  $('#code_editor_col').animate({
    width: "5%"
  }, 600);
  window.setTimeout(function() {
    $('#bracket_col').animate({
      width: "95%"
    }, 600, function() {
      $('.team').css('font-size', '12px');
      $('.b .top').css('top', '-17px');
    });
  }, 400);
};

var showSaveBracketNewUser = function() {
  $('#registerModal').modal();
  // $('#saveBracketModal').modal();

};

var setupBracketEvents = function (bracket) {
  $('#startbutton').click(function(e) {
    e.preventDefault();

    // clear bracket with default HTML
    $('#bracket').html(html);

    var btn = $(this);
    btn.button('loading');
    bracket.toggleSpinner(true);

    $('#bracket_blur_image').fadeOut();

    var f = eval("("+editor.getValue()+")");
    if (_.isFunction(f)) {
      bracket.play(f, function () {
        bracket.toggleSpinner(false);
        btn.button('reset');
        $('#bracket_status').slideDown();
      });
    } else {
      alert("It seems like your function has an error in it.");
    }
  });

  $('#modify_code_btn').click(function(e) {
      var expandEditor = function () {
        $('#bracket_col').animate({
          width: "60%"
        }, 600);
        window.setTimeout(function() {
          $('#code_editor_col').animate({
            width: "40%"
          }, 600, function() {
            $('#editor textarea').focus();
          });
        }, 500);
      };
      expandEditor();
    $('#bracket_status').slideUp(function() {});
  });

  var center_msg = function () {
    var bracket_height = $('#bracket').height();
    var bracket_width = $('#bracket').width();
    var init_bracket_msg = $('#matrix');
    var newtop = Math.floor(bracket_height/2 - init_bracket_msg.height()/2);
    var newleft = Math.floor(bracket_width/2 - init_bracket_msg.width()/2);

    init_bracket_msg.css('left', newleft + "px");
    init_bracket_msg.css('top', newtop + "px");
  };
  $(center_msg);
  $(window).resize(center_msg);

  var save_clicked = function(e) {
    if (!logged_in_user){
      showSaveBracketNewUser();
    } else {
      $('#saveBracketModal').modal();
      $('#regmessage').html("<h4>Please give your code bracket a name.</h4>");
      $('#bracket_name').focus();
    }
    e.preventDefault();
  };

  $("#saveBracketNewUser").on("submit", function(event) {
    event.preventDefault();
    // $(this).serialize();
    var first_name = this.first_name.value;
    var last_name = this.last_name.value;
    var email = this.email.value;
    var nickname = this.nickname.value;
    var password = this.password.value;

    var params = {
      first_name: first_name,
      last_name: last_name,
      email: email,
      nickname: nickname,
      password: password
    };

    $.post('/register.json', params, function(data, textStatus, xhr) {
      $('#registerModal').modal('hide');

      if (data.show_login) {
        window.location="/login?forwardpath="+window.location.pathname;
      } else {
        $('#saveBracketModal').modal();
        $('#is_new_user').val("yes");
        $('#bracket_name').focus();
      }

      // bracket: JSON.stringify(bracket.data);

    });
  });

  $('#save_bracket_btn').click(save_clicked);
  $('#save_new_user_btn').click(function(e) {

  });

  $("#saveBracketForm").on("submit", function(event) {
    event.preventDefault();
    // $(this).serialize();
    var bracket_name = this.bracket_name.value;
    var bracket_data = JSON.stringify(bracket.data);
    var bracket_code = editor.getValue();
    var winner = {sid: bracket.winner.sid, name: bracket.winner.name};
    var is_new_user = this.is_new_user.value;
    
    var params = {
      bracket_data: bracket_data,
      bracket_name: bracket_name,
      bracket_code: bracket_code,
      bracket_winner: winner,
      is_new_user: is_new_user
    };

    $.post('/save_bracket', params, function(data, textStatus, xhr) {
      $('#saveBracketModal').modal('hide');
      if (!!data.bracket) {
        window.location = "/code_bracket/"+data.bracket._id;
      }
    });
  });

  $('#menu-reset').click(function() {
    editor.setValue("function (game, team1, team2) {\n  \n}", 1);
    editor.focus();
  });

  function setEditorCode(c) {
    var code = "";
    code += "function (game, team1, team2) {\n";
    code += c + "\n";
    code += "}";
    editor.setValue(code,1);
  }
  $('.dropdown-menu a').click( function () {
    setEditorCode($('#'+this.id+'-code').text());
  });
};
// var expandEditor = function () {
//   $('#code_editor_col').animate({
//     width: "5%"
//   }, 600);
//   window.setTimeout(function() {
//     $('#bracket_col').animate({
//       width: "95%"
//     }, 600, function() {
//       $('.team').css('font-size', '12px');
//       $('.b .top').css('top', '-17px');
//     });
//   }, 400);
// };
