var DT_garbage_pickup = (function () {
    function getRawValue(device) {
        if (!device) return ''
        return device.Data || device.sValue || device.Usage || ''
    }

    function createDate(year, month, day, hours, minutes, seconds) {
        var parsedDate = new Date(
            year,
            month - 1,
            day,
            hours || 0,
            minutes || 0,
            seconds || 0,
            0,
        )

        if (
            parsedDate.getFullYear() !== year ||
            parsedDate.getMonth() !== month - 1 ||
            parsedDate.getDate() !== day
        ) {
            return null
        }

        return parsedDate
    }

    function parsePickupDate(rawValue) {
        var value = (rawValue || '').toString().trim()
        var match

        if (!value) return null

        match = value.match(
            /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
        )
        if (match) {
            return createDate(
                parseInt(match[1], 10),
                parseInt(match[2], 10),
                parseInt(match[3], 10),
                parseInt(match[4] || 0, 10),
                parseInt(match[5] || 0, 10),
                parseInt(match[6] || 0, 10),
            )
        }

        match = value.match(
            /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
        )
        if (match) {
            return createDate(
                parseInt(match[3], 10),
                parseInt(match[2], 10),
                parseInt(match[1], 10),
                parseInt(match[4] || 0, 10),
                parseInt(match[5] || 0, 10),
                parseInt(match[6] || 0, 10),
            )
        }

        var fallback = new Date(value)
        if (!isNaN(fallback.getTime())) return fallback

        return null
    }

    function startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    }

    function getStateInfo(pickupDate) {
        var today = startOfDay(new Date())
        var pickupDay = startOfDay(pickupDate)
        var dayDiff = Math.round(
            (pickupDay.getTime() - today.getTime()) / 86400000,
        )
        var state = 'upcoming'

        if (dayDiff === 0) state = 'today'
        else if (dayDiff === 1) state = 'tomorrow'
        else if (dayDiff < 0) state = 'overdue'

        return {
            state: state,
            dayDiff: dayDiff,
            pickupDay: pickupDay,
        }
    }

    function getTitle(me, device) {
        if (me.block.title === false) return ''
        if (typeof me.block.title === 'string' && me.block.title.length)
            return me.block.title
        return device && device.Name ? device.Name : 'Garbage pickup'
    }

    function getIcon(me, state) {
        if (state === 'today') return me.block.iconToday || me.block.iconDefault
        if (state === 'tomorrow')
            return me.block.iconTomorrow || me.block.iconDefault
        if (state === 'overdue')
            return (
                me.block.iconOverdue ||
                me.block.iconToday ||
                me.block.iconDefault
            )
        return me.block.iconDefault
    }

    function getCountdownLabel(dayDiff) {
        if (dayDiff === 0) return 'Today'
        if (dayDiff === 1) return 'Tomorrow'
        if (dayDiff === -1) return '1 day overdue'
        if (dayDiff < 0) return Math.abs(dayDiff) + ' days overdue'
        if (dayDiff === 2) return '2 days'
        return dayDiff + ' days'
    }

    function getStatusLabel(dayDiff) {
        if (dayDiff === 0) return 'Pickup day'
        if (dayDiff === 1) return 'Put it out tonight'
        if (dayDiff < 0) return 'Waiting for the next date'
        return 'Until pickup'
    }

    function getRootClass(me, state) {
        return (
            'col-xs-' +
            (me.block.width || 4) +
            ' block_garbage-pickup dt_block state-' +
            state
        )
    }

    function getConfigValue(primaryKey, fallbackKey) {
        if (typeof config !== 'undefined') {
            if (config[primaryKey]) return config[primaryKey]
            if (fallbackKey && config[fallbackKey]) return config[fallbackKey]
        }

        if (typeof settings !== 'undefined') {
            if (settings[primaryKey]) return settings[primaryKey]
            if (fallbackKey && settings[fallbackKey])
                return settings[fallbackKey]
        }

        return ''
    }

    function getLocaleTag() {
        var language = getConfigValue('calendarlanguage', 'language')
        var normalizedLanguage

        if (language && language.toString) language = language.toString().trim()
        if (!language) return undefined

        normalizedLanguage = language.replace(/_/g, '-')

        if (typeof Intl === 'undefined' || !Intl.getCanonicalLocales) {
            return normalizedLanguage
        }

        try {
            return Intl.getCanonicalLocales(normalizedLanguage)[0]
        } catch (error) {
            return undefined
        }
    }

    function getMomentLocale() {
        var language = getConfigValue('calendarlanguage', 'language')

        if (language && language.toString) language = language.toString().trim()
        if (!language) return undefined

        return language.replace(/_/g, '-').toLowerCase()
    }

    function hasExplicitTime(rawValue) {
        return /[ T]\d{1,2}:\d{2}(?::\d{2})?$/.test(
            (rawValue || '').toString().trim(),
        )
    }

    function getCalendarFormat(includeTime) {
        var configuredFormat =
            getConfigValue('calendarformat') || getConfigValue('timeformat')

        if (!configuredFormat) return 'ddd D MMM YYYY'
        if (includeTime) return configuredFormat

        return (
            configuredFormat
                .replace(/\s+[Hh]{1,2}[:.]mm(?::ss)?\s*[Aa]?$/g, '')
                .trim() || 'ddd D MMM YYYY'
        )
    }

    function formatPickupDate(date, rawValue) {
        var includeTime = hasExplicitTime(rawValue)
        var calendarFormat = getCalendarFormat(includeTime)
        var language = getLocaleTag()
        var momentLocale = getMomentLocale()

        if (typeof moment !== 'undefined') {
            return moment(date)
                .locale(momentLocale || undefined)
                .format(calendarFormat)
        }

        return date.toLocaleDateString(language, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    function setText(elementId, value) {
        var element = document.getElementById(elementId)
        if (element) element.textContent = value
    }

    function updateCard(me, device) {
        var root = document.getElementById('garbage-pickup-' + me.block.idx)
        var icon = document.getElementById(
            'garbage-pickup-icon-' + me.block.idx,
        )
        var rawValue = getRawValue(device)
        var pickupDate = parsePickupDate(rawValue)
        var stateInfo

        setText('garbage-pickup-title-' + me.block.idx, getTitle(me, device))

        if (!root || !icon) return

        if (!pickupDate) {
            root.className = getRootClass(me, 'invalid')
            icon.className = 'garbage-pickup-icon ' + me.block.iconDefault
            setText(
                'garbage-pickup-countdown-' + me.block.idx,
                'No valid pickup date',
            )
            setText(
                'garbage-pickup-status-' + me.block.idx,
                'Expected a device value like 2026-03-28',
            )
            setText(
                'garbage-pickup-date-' + me.block.idx,
                rawValue || 'Awaiting data',
            )
            return
        }

        stateInfo = getStateInfo(pickupDate)

        root.className = getRootClass(me, stateInfo.state)
        icon.className = 'garbage-pickup-icon ' + getIcon(me, stateInfo.state)
        setText(
            'garbage-pickup-countdown-' + me.block.idx,
            getCountdownLabel(stateInfo.dayDiff),
        )
        setText(
            'garbage-pickup-status-' + me.block.idx,
            getStatusLabel(stateInfo.dayDiff),
        )
        setText(
            'garbage-pickup-date-' + me.block.idx,
            formatPickupDate(pickupDate, rawValue),
        )
    }

    function buildHTML(me) {
        var width = me.block.width || 4

        return (
            '<div id="garbage-pickup-' +
            me.block.idx +
            '" data-id="garbage-pickup" class="col-xs-' +
            width +
            ' block_garbage-pickup dt_block state-upcoming">' +
            '<div class="garbage-pickup-card">' +
            '<div class="garbage-pickup-icon-shell">' +
            '<i id="garbage-pickup-icon-' +
            me.block.idx +
            '" class="garbage-pickup-icon ' +
            me.block.iconDefault +
            '"></i>' +
            '</div>' +
            '<div class="garbage-pickup-copy">' +
            '<div id="garbage-pickup-title-' +
            me.block.idx +
            '" class="garbage-pickup-title"></div>' +
            '<div id="garbage-pickup-countdown-' +
            me.block.idx +
            '" class="garbage-pickup-countdown"></div>' +
            '<div id="garbage-pickup-status-' +
            me.block.idx +
            '" class="garbage-pickup-status"></div>' +
            '<div id="garbage-pickup-date-' +
            me.block.idx +
            '" class="garbage-pickup-date"></div>' +
            '</div>' +
            '</div>' +
            '</div>'
        )
    }

    function refreshFromDevice(me) {
        var device = Domoticz.getAllDevices(me.block.idx)
        updateCard(me, device)
    }

    return {
        name: 'garbage-pickup',
        init: function () {
            return DT_function.loadCSS('./js/components/garbage-pickup.css')
        },
        canHandle: function (block) {
            return block && block.type && block.type === 'garbage-pickup'
        },
        defaultCfg: {
            width: 4,
            title: true,
            iconDefault: 'fa-solid fa-recycle',
            iconTomorrow: 'fa-solid fa-trash-can',
            iconToday: 'fa-solid fa-trash-can-arrow-up',
            iconOverdue: 'fa-solid fa-trash-can-arrow-up',
            refreshInterval: 60000,
        },
        run: function (me) {
            var refreshInterval = Math.max(
                1000,
                parseInt(me.block.refreshInterval, 10) || 60000,
            )

            $(me.mountPoint).html(buildHTML(me))
            refreshFromDevice(me)

            Dashticz.subscribeDevice(me, me.block.idx, true, function (device) {
                updateCard(me, device)
            })

            if (me._garbagePickupTimer) clearInterval(me._garbagePickupTimer)
            me._garbagePickupTimer = setInterval(function () {
                refreshFromDevice(me)
            }, refreshInterval)
        },
    }
})()

Dashticz.register(DT_garbage_pickup)
