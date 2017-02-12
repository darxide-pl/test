var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();      
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    receivedEvent: function(id) {
        this.events.handler()
    }, 

    /**
     *  setting  
     */
    settings : {
        api : 'http://www.leki.dariuszm.pl/drugs/api/',
        finder : $('.finder'),
        menu : $('.menu'),
        list : 'medicine',
        search : {
            mode : 'name_like',
            levenshtein : 5,
        },
        pages : {
            current : 1,
            items : 20
        },
        order : {
            by : 'name',
            dir : 'asc'
        },
        lock : 0,
        end : 0
    },

    data : {},

    /**
     *  events handler
     */
    events : {
        handler : function() {
            app.events.search()
            app.events.alerts()
            app.events.menu()
            app.events.list()
            app.events.settings()
        },
        search : function() {
            $(document).on('submit' , '.search' , function(e) {
                app.list.reset()
                app.fetch()
                e.preventDefault()
                return false
            })
            $(document).on('click' , '.search-addon' , function() {
                app.list.reset()
                app.fetch()
            })            
        },
        alerts : function() {
            $(document).on('click' , '.alert' , function() {
                $(this).fadeOut(300 , function() {
                    $(this).remove()
                })
            })
        },
        menu : function() {
            $(document).on('click' , '.menu-trigger' , function() {
                app.menu.open()
            })
            $(document).on('click', '.menu .load' , function() {
                app.menu.close()
                app.settings.list = $(this).data('list')
                app.list.reset()
                app.fetch()
            })
            $(document).on('swiperight' , function() {
                app.menu.open()
            })
            $(document).on('swipeleft' , function() {
                app.menu.close()
            })
            $(document).on('click' , '.menu .close' , function() {
                app.menu.close()
            })
        },
        list : function() {
            $(window).scroll(function() {
                if($('.list .list-item').length > 0 && app.settings.lock == 0 && app.settings.end == 0) {
                    if($(window).scrollTop() + $(window).height() > $('.list').height() - 100) {
                        app.fetch()
                    }
                }
            })
        },
        settings : function() {
            $(document).on('click' , '.settings' , function() {
                $('.settings-container').addClass('open')
            })

            $(document).on('click' , '.btn-settings-close' , function() {
                $('.settings-container').removeClass('open')
            })
            $(document).on('change','[name="search_mode"]' , function() {
                $('.info-item').slideUp(240)
                $('.info-item[data-info="'+$(this).val()+'"]').slideDown(240)

                app.settings.search.mode = $(this).val()

                if($(this).val() == 'lev') {
                    $('.lev').slideDown(240)
                } else {
                    $('.lev').slideUp(240)
                }

            })
            $(document).on('change' , '.lev input' , function() {
                app.settings.search.levenshtein = $(this).val()
            })
        }
    },

    /**
     *  menu handlers
     */
    menu : {
        open : function() {
            app.settings.menu.addClass('open')
        },
        close : function() {
            app.settings.menu.removeClass('open')
        }

    },

    /**
     *  list handler
     */
    list : {
        reset : function() {
            $('.list .content').html("")
            app.settings.pages.current = 1
            app.settings.end = 0
        },
        build : function() {
            var row,
                item,
                forms

            if(app.settings.list == 'medicine') {            
                for (var k in app.data.list) {
                    row = app.data.list[k]
                    item = app.template.list.drug()

                    item = item.replace('{{id}}' , row.id)
                    item = item.replace('{{name}}' , row.name)
                    item = item.replace('{{type}}' , 'medicine')
                    item = item.replace('{{last_modify}}' , 'ostatnia aktualizacja: '+row.last_modify.substr(0,10))

                    item = item.replace('{{views}}' , row.views)
                    item = item.replace('{{count_substances}}' , row.count_substances)
                    item = item.replace('{{count_forms}}' , row.count_forms)
                    item = item.replace('{{count_specializations}}' , row.count_specializations)
                    item = item.replace('{{count_treatments}}' , row.count_treatments)

                    forms = ''

                    for(var a in row.contains.forms) {
                        forms += row.contains.forms[a].name+' '
                    }

                    item = item.replace('{{forms}}' , forms)

                    $('.list .content').append(item)
                }
            }
        },
        end : function() {
            $('.list .content').append( $('<div>')
                                            .css({
                                                'text-align':'center',
                                                'padding':'12px'
                                            })
                                            .text('koniec listy') )
            app.settings.end = 1
        }

    },

    template : {
        list : {
            drug : function() {
                return $('.templates .drug').html()
            }
        }
    },

    /**
     *  form handler
     */
    finder : {
        up : function() {
            $('.search').addClass('up')
        },
        down : function() {
            $('.search').removeClass('up')
        }
    },

    /**
     *  loader handlers
     */
    loader : {
        list : {
            on : function() {
                $('.list .loader').fadeIn(240)
            },
            off : function() {
                $('.list .loader').fadeOut(240)
            }            
        }
    },

    message : {
        fail : function(body) {
            $('body').append(app.message.element(body, 'fail'))
        },
        succes : function(body) {
            $('body').append(app.message.element(body , 'succes'))
        },
        element : function(body, mode) {
            var icon = mode == 'fail' ? 'fa-exclamation-triangle' : 'fa-info',
                uniq = app.helper.uniq()

            app.message.autohide('#alert-'+uniq)

            return $('<div>')
                        .addClass('alert alert-'+mode)
                        .attr('id' , 'alert-'+uniq)
                        .html('<i class="fa fa-fw '+icon+'"></i> '+body)
        },
        autohide : function(selector) {
            setTimeout(function() {
                $(selector).fadeOut(300 , function() {
                    $(this).remove()
                })
            }, 1500)
        }
    },

    /**
     *  handler for settings changes
     */
    set : {

    },

    /**
     *  fetching
     */
    fetch : function() {
        app.loader.list.on()
        app.finder.up()
        app.settings.lock = 1
        $.post(app.settings.api+app.settings.list+app.parse.params())
        .done(function(data) {
            app.loader.list.off()
            app.settings.lock = 0
            app.data = JSON.parse(data)

            if(app.data.status == 0) {
                app.message.fail('błędna odpowiedź serwera')
            } else {            
                if(app.data.list.length == 0) {
                    app.message.succes('brak wyników wyszukiwania')
                } else {
                    if(app.data.pages > app.settings.pages.current) {
                        app.list.build()
                        app.settings.pages.current++                    
                    } else {
                        app.list.build()
                        app.list.end()
                    }
                }
            }


        }).fail(function() {
            app.loader.list.off()
            app.settings.lock = 0
            app.message.fail('błąd serwera')
        })
    },

    /**
     *  parsing links, lists ona other parsing stuff
     */
    parse : {
        params : function() {
            var params = [],
                query = app.settings.finder.val()

            if(query.length > 0) {
                if(app.settings.search.mode != 'lev') {
                    params.push(app.settings.search.mode+'/'+query)
                } else {
                    params.push(app.settings.search.mode+'/'+query+'/lev_less/'+app.settings.search.levenshtein)
                }
            }

            params.push('page_nr/'+app.settings.pages.current)
            params.push('order/'+app.settings.order.by)
            params.push('dir/'+app.settings.order.dir)
            params.push('on_page/'+app.settings.pages.items)

            params.push('count_substances/1')
            params.push('count_forms/1')
            params.push('count_specializations/1')
            params.push('count_treatments/1')

            params.push('contains_categories/1')
            params.push('contains_forms/1')

            return '/'+params.join('/')
        }

    },

    /**
     *  helpers, utils
     */
    helper : {
        uniq : function() {
            return Math.round(Math.random()*1000000)
        }
    }
};
