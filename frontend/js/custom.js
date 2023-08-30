$(document).ready(function(){
   $('.hm-menu').click(function(){
      $('.hm-menu span').toggleClass('active');
      $('header').toggleClass('active');
       $('header').removeClass('activex');
   });
    $('.right a').click(function(){
        $('.hm-menu span').removeClass('active');
        $('header').removeClass('active');
        $('header').addClass('activex');
    });
});