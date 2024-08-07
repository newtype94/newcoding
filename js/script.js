/* 세 개의 사용자 정의 JS 메서드 선언 */
/* 대소문자를 구분하지 않는 포함 판단, 기사 제목을 검색하여 기사를 필터링하는 데 사용 */
jQuery.expr[":"].contains = function (a, i, m) {
  return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
};
/* 대소문자를 구분하는 포함 판단, 기사 제목을 검색하여 기사를 필터링하는 데 사용 */
jQuery.expr[":"].containsSensitive = function (a, i, m) {
  return jQuery(a).text().indexOf(m[3]) >= 0;
};
/* 대소문자를 구분하여 태그를 검색하여 기사를 필터링하는 데 사용 */
jQuery.expr[":"].contains_tag = function (a, i, m) {
  var tags = String(jQuery(a).data("tag")).split(",");
  return $.inArray(m[3], tags) !== -1;
};
/* 대소문자를 구분하여 저자를 검색하여 기사를 필터링하는 데 사용 */
jQuery.expr[":"].contains_author = function (a, i, m) {
  var tags = String(jQuery(a).data("author")).split(",");
  return $.inArray(m[3], tags) !== -1;
};
var blog_path = $(".theme_blog_path").val();
blog_path =
  blog_path.lastIndexOf("/") === blog_path.length - 1
    ? blog_path.slice(0, blog_path.length - 1)
    : blog_path;

/* pjax를 사용하여 페이지를 로드하면 더 빠르고 상호작용이 더 좋습니다 */
var content = $(".pjax");
var container = $("#post");
var $searchInput = $("#local-search-input");
var $tagSearchInput = $("#tag-search");
var $outlineList = $("#outline-list");
var $fullBtn = $(".full-toc .full");
var $titleList = $("nav");
var $localSearchResult = $("#local-search-result");
var isFullScreen = $(window).width() <= 1024;
var isFriend = false;
var shortcutKey = $("#theme_shortcut").val() !== "false";
$(document).pjax(
  ".nav-right nav a,.nav-left .avatar_target,.site_url",
  ".pjax",
  { fragment: ".pjax", timeout: 8000 }
);
$(document).on({
  /* 링크 클릭 후 트리거되는 이벤트 */
  "pjax:click": function () {
    /* 기존 콘텐츠 페이드 아웃 */
    content.removeClass("fadeIns").addClass("fadeOuts");
    /* 요청 진행률 표시기 */
    NProgress.start();
  },

  /* pjax가 페이지 요청을 시작할 때 트리거되는 이벤트 */
  "pjax:start": function () {
    content.css({ opacity: 0 });
  },

  /* pjax가 페이지 요청을 완료한 후 트리거되는 이벤트 */
  "pjax:end": function () {
    NProgress.done();
    container.scrollTop(0);
    afterPjax();

    /* 모바일에서 기사를 열면 자동으로 기사 목록을 숨깁니다 */
    if ($(window).width() <= 1024) {
      if ($fullBtn.children().hasClass("max")) {
        $fullBtn.trigger("click");
      } else if ($(".nav").hasClass("mobile")) {
        $(".nav").removeClass("mobile");
        $fullBtn.children().removeClass("mobile");
      }
    }
  },
  click: function (e) {
    $(".nav-right .tags-list").hide();
  },
});
function afterPjax() {
  // 기본 기사 배경
  if (
    blog_path === ""
      ? location.pathname === "/"
      : blog_path === location.pathname.split("/")[1]
  ) {
    container.addClass("index");
  } else {
    container.removeClass("index");
  }

  /* MathJax 수식 렌더링 */
  if ($("script[type='text/x-mathjax-config']").length > 0) {
    $.getScript($("#MathJax-js").val(), function () {
      MathJax.Hub.Queue(
        ["resetEquationNumbers", MathJax.InputJax.TeX],
        ["Typeset", MathJax.Hub]
      );
    });
  }

  /* 새로운 콘텐츠 페이드 인 */
  content.css({ opacity: 1 }).removeClass("fadeOuts").addClass("fadeIns");
  bind();
  /* discus로 댓글 수 가져오기 */
  if ($(".theme_disqus_on").val() === "true") {
    DISQUSWIDGETS.getCount({ reset: true });
  }
  if ($("#comments").hasClass("disqus")) {
    setTimeout(function () {
      if ($(".count-comment").text().trim() === "") {
        $(".count-comment").text(0);
      }
    }, 300);
  }
}

/* 기사 카테고리 전환 */
$(".nav-left ul li>div").on("click", function (e) {
  $(".friend").removeClass("friend"); // 현재 친구 페이지에 있으면 먼저 표시
  $(".nav-left li>div.active").removeClass("active");
  $(this).addClass("active");
  $searchInput.val("").change();
  var categories = String($(this).data("rel")).split("<--->");
  $("#default-panel > .right-title").text(categories[categories.length - 1]);
  $("#default-panel").show().siblings().hide();
  $outlineList.hide();
});

/* 하위 카테고리 높이 렌더링 */
$(".nav-left ul.sub").each(function () {
  $(this).height($(this).children().length * 26 - 1);
});

/* 하위 카테고리 확장 */
$(".nav-left ul>li>div>.fold").on("click", function (e) {
  var _this = this;
  e.stopPropagation();
  $(_this).toggleClass("unfold");
  $(_this).parent().next().toggleClass("hide");
  $(_this)
    .parents("ul.sub")
    .each(function () {
      if ($(_this).hasClass("unfold")) {
        $(this).height(
          $(this).height() +
            parseInt($(_this).parent().next().attr("style").match(/\d+/g)[0]) +
            1
        );
      } else {
        $(this).height(
          $(this).height() -
            parseInt($(_this).parent().next().attr("style").match(/\d+/g)[0]) -
            1
        );
      }
    });
});

/* 기사 목록에서 마우스를 뗀 후 기사 제목의 hover 스타일 제거 */
$(".nav-right nav a").mouseenter(function (e) {
  $(".nav-right nav a.hover").removeClass("hover");
  $(this).addClass("hover");
});
$(".nav-right nav a").mouseleave(function (e) {
  $(this).removeClass("hover");
});

/* 단축키/조합키 */
var publickey = { shift: false, ctrl: false, alt: false, last: 0 };
if (shortcutKey) {
  $(document).keydown(function (e) {
    var tobottom =
      container.prop("scrollHeight") -
      container.scrollTop() -
      container.height();
    var totop = container.scrollTop();
    if (
      !$searchInput.is(":focus") &&
      !$tagSearchInput.is(":focus") &&
      !$("#comments textarea").is(":focus")
    ) {
      if (e.keyCode === 74) {
        /* J */
        container.animate(
          { scrollTop: container.prop("scrollHeight") - container.height() },
          tobottom,
          "linear"
        );
      } else if (e.keyCode === 75) {
        /* K */
        container.animate({ scrollTop: 0 }, totop, "linear");
      } else if (e.keyCode === 71) {
        /* G */
        if (publickey.shift) {
          container.animate({ scrollTop: container.prop("scrollHeight") }, 800);
        } else if (publickey.last === 71) {
          /* G */
          container.animate({ scrollTop: 0 }, 800);
        }
      } else if (e.keyCode === 16) {
        /* shift */
        publickey.shift = true;
      }
    }
  });

  $(document).keyup(function (e) {
    if (
      !$searchInput.is(":focus") &&
      !$tagSearchInput.is(":focus") &&
      !$("#comments textarea").is(":focus")
    ) {
      if (e.which === 83) {
        /* S - 기사 목록 표시/숨기기 */
        $fullBtn.trigger("click");
      } else if (
        (e.which === 73 || e.which === 105) &&
        $(".nav").css("margin-left") === "0px" &&
        !$(".title-list").hasClass("friend")
      ) {
        /* I */
        inputChange();
      } else if (e.which === 87) {
        /* W - 개요 보기 전환 */
        if ($outlineList.is(":visible")) {
          $("#outline-panel > .icon-list").trigger("click");
        } else {
          if ($("#local-search-result").is(":visible")) {
            $searchInput.val("");
            inputChange();
          }
          $("#default-panel").hide();
          $("#title-list-nav").hide();
          $("#search-panel").hide();
          $("#outline-panel").show();
          $outlineList.show();
          syncOutline(container[0]);
        }
        // 전체 화면이면 전체 화면을 종료합니다.
        if (isFullScreen) {
          $fullBtn.trigger("click");
        }
        // 친구 링크 페이지에 있으면 친구 링크를 종료합니다.
        if (isFriend) {
          $(".friends-area .icon-left").trigger("click");
        }
      } else if (e.which === 74 || e.which === 75) {
        /* J K - 위로/아래로 스크롤 */
        container.stop(true);
      } else if (e.which === 16) {
        publickey.shift = false;
      }
    }
    publickey.last = e.keyCode;
  });
}

$searchInput.blur(function (e) {
  $(".nav-right nav a.hover").removeClass("hover");
});
/* 입력 상자 포커스 시 단축키 캡처 */
$searchInput.keydown(function (e) {
  if (
    $(".nav-right nav a:not(:hidden), #local-search-result a:not(:hidden)")
      .length > 0
  ) {
    if (e.which === 13) {
      /* 엔터 */
      var $handle = $(
        ".nav-right nav a.hover:not(:hidden), #local-search-result a.hover:not(:hidden)"
      );
      if ($handle.length === 0) {
        $(
          ".nav-right nav a:not(:hidden):first, #local-search-result a:not(:hidden):first"
        ).trigger("click");
      } else {
        $handle.trigger("click");
      }
      $(":focus").blur();
    } else if (e.which === 38) {
      /* 위 */
      if (!$("nav").is(":visible")) {
        if (
          $("#local-search-result a.hover").length === 0 ||
          $("#local-search-result a.hover").parent().prevAll(":visible")
            .length === 0
        ) {
          $localSearchResult.scrollTop($localSearchResult.prop("scrollHeight"));
          $("#local-search-result a.hover").removeClass("hover");
          $("#local-search-result a:visible:last").addClass("hover");
        } else {
          $("#local-search-result a.hover")
            .parent()
            .prevAll()
            .each(function () {
              if ($(this).is(":visible")) {
                $("#local-search-result a.hover").removeClass("hover");
                $(this).children().addClass("hover");
                if (
                  $(this).offset().top - $(".nav-right .right-top").height() <
                  0
                ) {
                  $localSearchResult.scrollTop(
                    $localSearchResult.scrollTop() - $(this).height()
                  );
                }
                return false;
              }
            });
        }
      } else {
        if (
          $("nav a:visible.hover").length === 0 ||
          $("nav a:visible.hover").prevAll(":visible").length === 0
        ) {
          $titleList.scrollTop($titleList.prop("scrollHeight"));
          $(".nav-right nav a.hover").removeClass("hover");
          $(".nav-right nav a:visible:last").addClass("hover");
        } else {
          $("nav a.hover")
            .prevAll()
            .each(function () {
              if ($(this).is(":visible")) {
                $(".nav-right nav a.hover").removeClass("hover");
                $(this).addClass("hover");
                if (
                  $(this).offset().top - $(".nav-right .right-top").height() <
                  0
                ) {
                  $titleList.scrollTop(
                    $titleList.scrollTop() - $(this).height()
                  );
                }
                return false;
              }
            });
        }
      }
    } else if (e.which === 9 || e.which === 40) {
      /* 아래 */
      if ($("nav").is(":visible")) {
        if (
          $("nav a:visible.hover").length === 0 ||
          $("nav a:visible.hover").nextAll(":visible").length === 0
        ) {
          $titleList.scrollTop(0);
          $(".nav-right nav a.hover").removeClass("hover");
          $(".nav-right nav a:visible:first").addClass("hover");
        } else {
          $("nav a.hover")
            .nextAll()
            .each(function () {
              if ($(this).is(":visible")) {
                $(".nav-right nav a.hover").removeClass("hover");
                $(this).addClass("hover");
                if (
                  $titleList.height() +
                    $(".nav-right .right-top").height() -
                    $(this).offset().top <
                  20
                ) {
                  $titleList.scrollTop(
                    $titleList.scrollTop() + $(this).height()
                  );
                }
                return false;
              }
            });
        }
      } else {
        if (
          $("#local-search-result a:visible.hover").length === 0 ||
          $("#local-search-result a:visible.hover").parent().nextAll(":visible")
            .length === 0
        ) {
          $localSearchResult.scrollTop(0);
          $("#local-search-result a.hover").removeClass("hover");
          $("#local-search-result a:visible:first").addClass("hover");
        } else {
          $("#local-search-result a.hover")
            .parent()
            .nextAll()
            .each(function () {
              if ($(this).is(":visible")) {
                $("#local-search-result a.hover").removeClass("hover");
                $(this).children().addClass("hover");
                if (
                  $localSearchResult.height() +
                    $(".nav-right .right-top").height() -
                    $(this).offset().top <
                  20
                ) {
                  $localSearchResult.scrollTop(
                    $localSearchResult.scrollTop() + $(this).prev().height()
                  );
                }
                return false;
              }
            });
        }
      }
      if (e.which === 9) {
        return false;
      }
    }
  }
  if (e.which === 27) {
    /* esc */
    if ($searchInput.val() === "") {
      $("#search-panel > .icon-left").trigger("click");
    } else {
      $searchInput.val("").change();
    }
  }
});
$searchInput.on("input", function (e) {
  inputChange();
});
$searchInput.on("change", function (e) {
  inputChange();
});
/* 검색 조건에 따라 기사 목록 필터링 */
function inputChange() {
  var i;
  setTimeout(function () {
    $searchInput.focus();
  }, 50);
  var val = $searchInput.val().trim();
  $("#search-panel").show().siblings().hide();
  $outlineList.hide();
  if ($("#local-search-result").length > 0) {
    if (
      val.length > 3 &&
      (val.substr(0, 3).toLowerCase() === "in:" ||
        val.substr(0, 3).toLowerCase() === "in：")
    ) {
      $outlineList.hide();
      $("#title-list-nav").hide();
      $("#local-search-result").show();
      searchAll(val.substr(3));
    } else {
      $("#title-list-nav").show();
      $("#local-search-result").hide();
    }
  } else {
    $outlineList.hide();
    $("#title-list-nav").show();
  }
  var categories = String($(".nav-left ul li>div.active").data("rel")).split(
    "<--->"
  );
  // 특수 문자 처리
  for (i = 0; i < categories.length; i++) {
    categories[i] = categories[i].replace(/(?=\/|\\|#|\(|\)|\[|\]|\.)/g, "\\");
  }
  var activeTitle = categories.join(".");
  var searchType = "";
  var containType = "";
  $("#no-item-tips").hide();
  $(".nav-right nav a .post-title .search-keyword").each(function () {
    $(this).parent().html($(this).parent().attr("title"));
  });
  if (val === "") {
    $(".nav-right nav a").css("display", "none");
    $(".nav-right nav a." + activeTitle).css("display", "block");
  } else if (val.substr(0, 1) === "#") {
    searchType = "태그";
    containType = "가";
    if (val.substr(1).length !== 0) {
      $(".nav-right nav a").css("display", "none");
      $(".nav-right nav")
        .find("a." + activeTitle + ":contains_tag('" + val.substr(1) + "')")
        .css("display", "block");
    }
  } else if (val.substr(0, 1) === "@") {
    searchType = "저자";
    containType = "가";
    if (val.substr(1).length !== 0) {
      $(".nav-right nav a").css("display", "none");
      $(".nav-right nav")
        .find("a." + activeTitle + ":contains_author('" + val.substr(1) + "')")
        .css("display", "block");
    }
  } else {
    searchType = "제목";
    containType = "이";
    // $(".nav-right nav a").css("display", "none");
    $(".nav-right nav")
      .find(
        "a." +
          activeTitle +
          ":" +
          ($("#search-panel > .icon-case-sensitive").hasClass("active")
            ? "containsSensitive"
            : "contains") +
          "('" +
          val +
          "')"
      )
      .css("display", "block");
    $(".nav-right nav a").each(function () {
      var title = $(this).children(".post-title").attr("title");
      for (i = 0; i < categories.length; i++) {
        if (!$(this).hasClass(categories[i])) {
          $(this).css("display", "none").children(".post-title").html(title);
          return true;
        }
      }

      var caseSensitive = $("#search-panel > .icon-case-sensitive").hasClass(
        "active"
      );
      var vals = (caseSensitive ? val : val.toUpperCase()).split("");
      var inputReg = new RegExp(vals.join("[\\s\\S]*"));
      if (inputReg.test(caseSensitive ? title : title.toUpperCase())) {
        // 매칭된 문자에 하이라이트 추가
        var nowPos = 0;
        var titleHtml = title.split("");
        var titleCase = (caseSensitive ? title : title.toUpperCase()).split("");
        for (i = 0; i < vals.length; i++) {
          nowPos = titleCase.indexOf(vals[i], nowPos);
          titleHtml[nowPos] = [
            '<span class="search-keyword">',
            titleHtml[nowPos],
            "</span>",
          ].join("");
        }
        $(this)
          .css("display", "block")
          .children(".post-title")
          .html(titleHtml.join(""));
      } else {
        $(this).css("display", "none").children(".post-title").html(title);
      }
    });
  }
  if (val !== "") {
    $("#default-panel .icon-search").addClass("active");
    if (val === "in:") {
      $("#no-item-tips")
        .show()
        .html("전체 키워드 검색 중입니다. 키워드를 입력하세요");
    } else if (
      !val.startsWith("in:") &&
      $(".nav-right nav a:visible").length === 0
    ) {
      $("#no-item-tips")
        .show()
        .html(
          " <span>" +
            activeTitle +
            "</span> 카테고리에서 " +
            searchType +
            containType +
            " <span>" +
            val.replace(/^[@|#]/g, "") +
            "</span>인 글을 찾을 수 없습니다"
        );
    }
  } else {
    $("#default-panel .icon-search").removeClass("active");
  }
}

/* 기사 목록 숨기기/표시 */
$(".full-toc .full,.semicircle").click(function (e) {
  isFullScreen = !isFullScreen;
  if ($fullBtn.children().hasClass("min")) {
    $fullBtn.children().removeClass("min").addClass("max");
    $(".nav, .hide-list").addClass("fullscreen");
    content.delay(200).queue(function () {
      $fullBtn.addClass("fullscreen").dequeue();
    });
  } else {
    $fullBtn.children().removeClass("max").addClass("min");
    $(".nav, .hide-list").removeClass("fullscreen");
    content.delay(300).queue(function () {
      $fullBtn.removeClass("fullscreen").dequeue();
    });
  }
});

container.hover(
  function () {
    $(".semicircle").css("margin-left", "-43px");
  },
  function () {
    $(".semicircle").css("margin-left", "0");
  }
);
var clickScrollTo = false;
function syncOutline(_this) {
  try {
    if ($('#outline-list .toc-link[href!="#"]').length > 0 && !clickScrollTo) {
      var activeIndex = null;
      $('#outline-list .toc-link[href!="#"]').each(function (index) {
        var diff =
          _this.scrollTop -
          $(_this).find(decodeURI($(this).attr("href")))[0].offsetTop;
        if (diff < -20) {
          activeIndex = index === 0 ? 0 : index - 1;
          return false;
        }
      });
      $('#outline-list .toc-link[href!="#"].active').removeClass("active");
      if (activeIndex === null) {
        $('#outline-list .toc-link[href!="#"]:last').addClass("active");
      } else {
        $(
          '#outline-list .toc-link[href!="#"]:eq(' + activeIndex + ")"
        ).addClass("active");
      }
      if (
        $('#outline-list .toc-link[href!="#"].active')[0].offsetTop -
          $outlineList.height() -
          $outlineList[0].scrollTop >
        -80
      ) {
        $outlineList.scrollTop(
          $('#outline-list .toc-link[href!="#"].active')[0].offsetTop +
            80 -
            $outlineList.height()
        );
      } else if (
        $('#outline-list .toc-link[href!="#"].active')[0].offsetTop <
        $outlineList[0].scrollTop
      ) {
        $outlineList.scrollTop(
          $('#outline-list .toc-link[href!="#"].active')[0].offsetTop
        );
      }
    }
  } catch (e) {
    console.error("목차 위치 동기화 실패!", e);
  }
}

$(function () {
  bind();
  $("[data-title]").quberTip({
    speed: 200,
  });
  // 스크롤 모니터링, 목차 동기화
  container.on("scroll", function () {
    var _this = this;
    var $rocket = $("#rocket");
    if (container.scrollTop() >= 200 && $rocket.css("display") === "none") {
      $("#rocket")
        .removeClass("launch")
        .css("display", "block")
        .css("opacity", "0.5");
    } else if (
      container.scrollTop() < 200 &&
      $rocket.css("display") === "block"
    ) {
      $("#rocket")
        .removeClass("launch")
        .css("opacity", "1")
        .css("display", "none");
    }
    syncOutline(_this);
  });

  $(".more-menus").on("click", function () {
    $(".mobile-menus-out").addClass("show");
    $(".mobile-menus").addClass("show");
  });
  $(".mobile-menus-out,.mobile-menus a").on("click", function () {
    $(".mobile-menus-out").removeClass("show");
    $(".mobile-menus").removeClass("show");
  });

  // 입력 상자 패널 표시
  $("#default-panel > .icon-search").on("click", function (e) {
    $(this).parent().hide();
    $("#search-panel").show();
    $searchInput.select();
  });
  /** 태그 - 시작 **/
  // 태그 패널 전환
  $("#search-panel > .icon-tag").on("click", function (e) {
    e.stopPropagation();
    var _offset = $(this).offset();
    var isPhone = $(window).width() <= 426;
    $(".nav-right .tags-list")
      .css({
        left: isPhone ? "auto" : _offset.left - 95 + "px",
        top: _offset.top + 30 + "px",
        right: isPhone ? "0" : "auto",
      })
      .toggle(100);
    setTimeout(function () {
      $tagSearchInput.val("").change().focus();
    }, 150);
  });
  // 태그 선택
  $(".nav-right .tags-list li").on("click", function (e) {
    $searchInput.val("#" + $(this).text().trim()).change();
  });
  // 버블링 방지
  $(".nav-right .tags-list").on("click", function (e) {
    e.stopPropagation();
  });

  $tagSearchInput
    .on("change", function () {
      tagSearchChange();
    })
    .on("input", function () {
      tagSearchChange();
    });
  function tagSearchChange() {
    var tagFilter = $tagSearchInput.val().trim();
    if (tagFilter === "") {
      $(".tags-list li").show();
    } else {
      $(".tags-list li").hide();
      $('.tags-list li:contains("' + tagFilter + '")').show();
    }
  }
  /** 태그 - 끝 **/

  // 기본 패널로 돌아가기
  $("#search-panel > .icon-left").on("click", function () {
    if ($("#local-search-result").is(":visible")) {
      $searchInput.val("");
      inputChange();
    }
    $(this).parent().hide();
    $("#default-panel").show();
  });

  $("#search-panel > .icon-case-sensitive").on("click", function () {
    $(this).toggleClass("active");
    inputChange();
  });

  // 개요 보기로 전환
  $("#default-panel > .icon-file-tree").on("click", function (e) {
    $(this).parent().hide();
    $("#title-list-nav").hide();
    $("#local-search-result").hide(); // 전체 검색 패널 숨기기
    $("#outline-panel").show();
    $outlineList.show();
    syncOutline(container[0]);
  });

  // 기본 패널로 돌아가기
  $("#outline-panel > .icon-list").on("click", function (e) {
    $(this).parent().hide();
    $outlineList.hide();
    $("#default-panel").show();
    $("#title-list-nav").show();
  });

  $(".nav-left>ul").css(
    "height",
    "calc(100vh - " +
      ($(".avatar_target img").outerHeight(true) +
        $(".author").outerHeight(true) +
        $(".nav-left .icon").outerHeight(true) +
        $(".left-bottom").outerHeight(true)) +
      "px)"
  );
  if ($("#local-search-result").length > 0) {
    // 전체 텍스트 검색
    $.getScript(blog_path + "/js/search.js", function () {
      searchFunc(
        blog_path + "/search.xml",
        "local-search-input",
        "local-search-result"
      );
    });
  }

  /* 페이지 맨 위로 이동 */
  $("#rocket").on("click", function (e) {
    $(this).addClass("launch");
    container.animate({ scrollTop: 0 }, 500);
  });

  if ($("#comments").hasClass("disqus")) {
    setTimeout(function () {
      if ($(".count-comment").text().trim() === "") {
        $(".count-comment").text(0);
      }
    }, 1500);
  }
  if ($(window).width() > 414) {
    /* 기사 목록 제목 너비 설정 */
    $(".nav-right>nav>a>.post-title").css(
      "width",
      $(".nav-right>nav>a").width() -
        $(".nav-right>nav>a>.post-date:first").width() -
        40
    );
  }

  /* 친구 링크 */
  $(".friends").on("click", function () {
    isFriend = !isFriend;
    $(".friends-area,.title-list").toggleClass("friend");
  });
  /* 친구 링크 종료 */
  $(".friends-area .icon-left").on("click", function () {
    isFriend = false;
    $(".friends-area,.title-list").removeClass("friend");
  });
});

/* 새로 로드된 콘텐츠의 클릭 이벤트 바인딩 */
function bind() {
  /* 코드 블록의 구조 및 스타일 하이라이트 렌더링 */
  if ($("#theme_highlight_on").val() === "true") {
    $("pre code").each(function (i, block) {
      var codeClass = $(this).attr("class") || "";
      var hasCopy = $("#theme_code_copy").val() !== "false";
      // 복사 기능 추가
      $(this).after(
        '<div class="code-embed"><span class="code-embed-type">' +
          (codeClass.indexOf("hljs") === -1
            ? codeClass
            : codeClass.indexOf("hljs") === 0
            ? ""
            : codeClass.replace(/[\s]?hljs/g, "")) +
          "</span>" +
          (hasCopy
            ? '<span class="code-embed-copy" onclick="copyCode(this)">copy</span>'
            : "") +
          "</div>"
      );
      // 스타일 렌더링
      if (codeClass.indexOf("hljs") === -1) {
        hljs.highlightBlock(block);
      }
    });
  }

  initArticle();
  $(".article_number").text($("#yelog_site_posts_number").val());
  $(".site_word_count").text($("#yelog_site_word_count").val());
  $(".site_uv").text($("#busuanzi_value_site_uv").text());
  $("#busuanzi_value_site_uv").bind("DOMNodeInserted", function (e) {
    $(".site_uv").text($(this).text());
  });
  $(".site_pv").text($("#busuanzi_value_site_pv").text());
  $("#busuanzi_value_site_pv").bind("DOMNodeInserted", function (e) {
    $(".site_pv").text($(this).text());
  });
  $("#post .pjax .index").find("br").remove();
  $("#post .pjax .index h1:eq(0)").addClass("article-title");
  // 기사 내 태그 검색 이벤트 바인딩
  $("#post .pjax article .article-meta .tag a").on("click", function (e) {
    $searchInput.val("#" + $(this).text().trim()).change();
    if ($(window).width() <= 1024) {
      $fullBtn.trigger("click");
    } else if ($(".full-toc .full span").hasClass("max")) {
      $fullBtn.trigger("click");
    }
  });
  // 기사 내 카테고리 클릭 이벤트 바인딩
  $("#post .pjax article .article-meta .book a").on("click", function (e) {
    $(".nav-left ul li>div[data-rel='" + $(this).data("rel") + "']")
      .parents(".hide")
      .each(function () {
        var _this = this;
        $(_this)
          .removeClass("hide")
          .prev()
          .children(".fold")
          .addClass("unfold");
        $(_this)
          .parents("ul.sub")
          .each(function () {
            $(this).height(
              parseInt($(this).attr("style").match(/\d+/g)[0]) +
                parseInt($(_this).attr("style").match(/\d+/g)[0]) +
                1
            );
          });
      });
    $(".nav-left ul li>div[data-rel='" + $(this).data("rel") + "']").trigger(
      "click"
    );
    if ($(window).width() <= 1024) {
      $fullBtn.trigger("click");
    } else if ($(".full-toc .full span").hasClass("max")) {
      $fullBtn.trigger("click");
    }
  });
  // 기사 내 저자 클릭 이벤트 바인딩
  $("#post .pjax article .article-meta .author").on("click", function (e) {
    // $searchInput.val("@" + $(this).text().trim()).change();
    // if ($(window).width() <= 1024) {
    //   $fullBtn.trigger("click");
    // } else if ($(".full-toc .full span").hasClass("max")) {
    //   $fullBtn.trigger("click");
    // }
    window.location='/'
  });
  // 기사 목차 초기화
  // $(".post-toc-content").html($("#post .pjax article .toc-ref .toc").clone());
  $("#outline-list").html($("#post .pjax article .toc-ref .toc").clone());
  $("#outline-list .toc").append(
    $("#post .pjax article .toc-ref > .toc-item").clone()
  );
  // 사용자 정의 제목의 연관 관계 수정
  $("#outline-list")
    .find(".toc-link")
    .each(function () {
      if (!$(this).attr("href")) {
        var tocText = $(this)
          .text()
          .replaceAll(/[^a-zA-Z0-9]/g, "");
        $(this).attr("href", "#" + encodeURIComponent(tocText));
        $(this)
          .parent()
          .attr("class")
          .split(" ")
          .forEach(function (item) {
            if (item.indexOf("toc-level-") !== -1) {
              $("#post")
                .find("h" + item.replace("toc-level-", ""))
                .each(function () {
                  if (
                    $(this)
                      .text()
                      .replaceAll(/[^a-zA-Z0-9]/g, "") === tocText
                  ) {
                    $(this).attr("id", encodeURIComponent(tocText));
                  }
                });
            }
          });
      }
    });
  syncOutline(container[0]);
  // 기사 목차의 스크롤 이벤트 바인딩
  $("a[href^='#']").click(function () {
    var $this = $(this);
    if ($this.parents("#outline-list").length > 0) {
      $('#outline-list .toc-link[href!="#"].active').removeClass("active");
      $this.addClass("active");
    }
    clickScrollTo = true;
    var targetOffsetTop = $(decodeURI($this.attr("href")))[0].offsetTop;
    container.animate(
      {
        scrollTop:
          container.scrollTop > targetOffsetTop
            ? targetOffsetTop + 20
            : targetOffsetTop - 20,
      },
      500,
      "swing",
      function () {
        clickScrollTo = false;
      }
    );
    return false;
  });
  if ($("#comments").hasClass("disqus")) {
    var $disqusCount = $(".disqus-comment-count");
    $disqusCount.bind("DOMNodeInserted", function (e) {
      $(".count-comment").text($this.text().replace(/[^0-9]/gi, ""));
    });
  }
  /* 사이트 내 이동을 위해 pjax 바인딩 */
  $(document).pjax("#post .pjax article a[target!=_blank]", ".pjax", {
    fragment: ".pjax",
    timeout: 8000,
  });

  /* img 초기화 */
  if (img_resize !== "photoSwipe") {
    content.find("img:not([data-ignore])").each(function () {
      if (!$(this).parent().hasClass("div_img")) {
        $(this).wrap("<div class='div_img'></div>");
        var alt = this.alt;
        if (alt) {
          $(this).after('<div class="img_alt"><span>' + alt + "</span></div>");
        }
      }
      if ($(window).width() > 426) {
        $(this).on("click", function (e) {
          var _that = $(this);
          $("body").append(
            '<img class="img_hidden" style="display:none" src="' +
              this.src +
              '" />'
          );
          var img_width = "";
          var img_height = "";
          var img_top = "";
          var img_left = "";
          if (
            this.width / this.height >
              document.body.clientWidth / document.body.clientHeight &&
            $(".img_hidden").width() > document.body.clientWidth
          ) {
            img_width = document.body.clientWidth + "px";
            img_height =
              (this.height * document.body.clientWidth) / this.width + "px";
            img_top =
              (document.body.clientHeight -
                (this.height * document.body.clientWidth) / this.width) /
                2 +
              "px";
            img_left = "0px";
          } else if (
            this.width / this.height <
              document.body.clientWidth / document.body.clientHeight &&
            $(".img_hidden").height() > document.body.clientHeight
          ) {
            img_width =
              (this.width * document.body.clientHeight) / this.height + "px";
            img_height = document.body.clientHeight + "px";
            img_top = "0px";
            img_left =
              (document.body.clientWidth -
                (this.width * document.body.clientHeight) / this.height) /
                2 +
              "px";
          } else {
            img_height = $(".img_hidden").height() + "px";
            img_width = $(".img_hidden").width() + "px";
            img_top =
              (document.body.clientHeight - $(".img_hidden").height()) / 2 +
              "px";
            img_left =
              (document.body.clientWidth - $(".img_hidden").width()) / 2 + "px";
          }
          $("body").append('<div class="img_max" style="opacity: 0"></div>');
          $("body").append(
            '<img class="img_max" src="' +
              this.src +
              '" style="top:' +
              $(this).offset().top +
              "px;left:" +
              $(this).offset().left +
              "px; width:" +
              $(this).width() +
              "px;height: " +
              this.height +
              'px;">'
          );
          $(this).css("visibility", "hidden");
          setTimeout(function () {
            $("img.img_max").attr("style", "").css({
              top: img_top,
              left: img_left,
              width: img_width,
              height: img_height,
            });
            $("div.img_max").css("opacity", "1");
          }, 10);
          $(".img_max").on("click", function (e) {
            $("img.img_max").css({
              width: _that.width() + "px",
              height: _that.height() + "px",
              top: _that.offset().top + "px",
              left: _that.offset().left + "px",
            });
            $("div.img_max").css("opacity", "0");
            setTimeout(function () {
              _that.css("visibility", "visible");
              $(".img_max").remove();
              $(".img_hidden").remove();
            }, 500);
          });
        });
      }
    });
  }
}

/**
 * 복사
 */
function copyCode(e) {
  $(e).parent().prev().text();
  if (copy($(e).parent().prev().text())) {
    $(e).html("copied!!");
    setTimeout(function () {
      $(e).html("copy");
    }, 1000);
  }
}

// 복사 기능1
function copy(text) {
  var isSuccess = false;
  var target;
  if (text) {
    target = document.createElement("textarea");
    target.id = "tempTarget";
    target.style.opacity = "0";
    target.value = text;
    document.body.appendChild(target);
    target.select();
    document.execCommand("copy", true);
    document.body.removeChild(target);
    isSuccess = true;
  } else {
    isSuccess = false;
  }
  return isSuccess;
}
