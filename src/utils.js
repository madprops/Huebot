const fs = require("fs")
const path = require('path')
const fetch = require("node-fetch")

module.exports = function (Huebot) {
  Huebot.is_protected_admin = function (uname) {
    return Huebot.db.config.protected_admins.includes(uname)
  }

  Huebot.is_admin = function (uname) {
    return Huebot.db.permissions.admins.includes(uname) || Huebot.is_protected_admin(uname)
  }

  Huebot.shuffle_array = function (array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // eslint-disable-line no-param-reassign
    }
  }

  Huebot.get_random_word = function (mode = "normal") {
    let word = Huebot.db.words[Huebot.get_random_int(0, Huebot.db.words.length - 1)]

    if (mode === "normal") {
      return word
    } else if (mode === "capitalized") {
      return word[0].toUpperCase() + word.slice(1)
    } else if (mode === "upper_case") {
      return word.toUpperCase()
    }
  }

  Huebot.get_random_phrase = function () {
    let contexts = [
      // bool=plural | bool=add_question_mark
      ["I want a", false, false],
      ["I feel like a", false, false],
      ["would you like a", false, true],
      ["I'm playing with a", false, false],
      ["you look like a", false, false],
      ["you're all a bunch of", true, false],
      ["I want to eat a", false, false],
      ["I see the", false, false],
    ]

    let word = Huebot.get_random_word()
    let context = contexts[Huebot.get_random_int(0, contexts.length - 1)]
    let en = ""

    if (context[0].endsWith(" a") && (word.startsWith("a") || word.startsWith("e") ||
        word.startsWith("i") || word.startsWith("o") || word.startsWith("u"))) {
      en = "n"
    }

    let plural = ""

    if (context[1]) {
      plural = "s"
    }

    let qs = ""

    if (context[2]) {
      qs = "?"
    }

    return `${context[0]}${en} ${word}${plural}${qs}`
  }

  Huebot.safe_replacements = function (s) {
    s = s.replace(/\$user\$/g, "[random user]")
    s = s.replace(/\$word\$/g, "[random word]")
    s = s.replace(/\$Word\$/g, "[random Word]")
    s = s.replace(/\$WORD\$/g, "[random WORD]")

    return s
  }

  Huebot.get_random_string = function (n) {
    let text = ""

    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

    for (let i = 0; i < n; i++) {
      text += possible[Huebot.get_random_int(0, possible.length - 1)]
    }

    return text
  }

  Huebot.string_similarity = function (s1, s2) {
    let longer = s1
    let shorter = s2

    if (s1.length < s2.length) {
      longer = s2
      shorter = s1
    }

    let longerLength = longer.length

    if (longerLength == 0) {
      return 1.0
    }

    return (longerLength - Huebot.string_similarity_distance(longer, shorter)) / parseFloat(longerLength)
  }

  Huebot.string_similarity_distance = function (s1, s2) {
    s1 = s1.toLowerCase()
    s2 = s2.toLowerCase()

    let costs = new Array()

    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i

      for (let j = 0; j <= s2.length; j++) {
        if (i == 0) {
          costs[j] = j
        } else {
          if (j > 0) {
            let newValue = costs[j - 1]

            if (s1.charAt(i - 1) != s2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue),
                costs[j]) + 1
            }

            costs[j - 1] = lastValue
            lastValue = newValue
          }
        }
      }

      if (i > 0) {
        costs[s2.length] = lastValue
      }
    }

    return costs[s2.length]
  }

  Huebot.is_admin_or_op = function (rol) {
    return rol === "admin" || rol.startsWith("op")
  }

  Huebot.get_random_int = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  Huebot.get_q_item = function (date, op = "normal") {
    date = parseInt(date)

    let media = ["image", "tv", "radio"]

    while (media.length > 0) {
      let i = 0

      for (let item of Huebot.db.queue[media[0]]) {
        if (item.date === date) {
          if (op === "delete") {
            Huebot.db.queue[media[0]].splice(i, 1)
          }

          return item
        }

        i += 1
      }

      media.shift()
    }

    return false
  }

  Huebot.save_file = function (name, content, callback = false) {
    let text = JSON.stringify(content)

    fs.writeFile(path.join(Huebot.files_path, name), text, 'utf8', function (err) {
      if (err) {
        console.error(err)
      } else {
        if (callback) {
          return callback()
        }
      }
    })
  }

  Huebot.fill_defaults = function (args, def_args) {
    for (let key in def_args) {
      let d = def_args[key]

      if (args[key] === undefined) {
        args[key] = d
      }
    }
  }

  Huebot.list_items = function (args = {}) {
    let def_args = {
      data: {},
      filter: "",
      prepend: "",
      append: "",
      sort_mode: "none",
      whisperify: false,
      mode: "",
      limit: true
    }

    Huebot.fill_defaults(args, def_args)

    args.filter = args.filter.toLowerCase()

    let do_filter = args.filter ? true : false
    let props

    if (Array.isArray(args.data)) {
      props = args.data
    } else {
      props = Object.keys(args.data)
    }

    let max

    if (args.limit) {
      max = Huebot.config.max_list_items
    } else {
      max = props.length
    }

    if (args.sort_mode === "random") {
      props = props.map(x => [Math.random(), x]).sort(([a], [b]) => a - b).map(([_, x]) => x)
    } else if (args.sort_mode === "sort") {
      props.sort()
    }

    let i = 0
    let s = ""

    for (let p of props) {
      if (do_filter) {
        if (p.toLowerCase().includes(args.filter)) {
          if (!on_added(p)) {
            break
          }
        }
      } else {
        if (!on_added(p)) {
          break
        }
      }
    }

    function on_added(p) {
      i += 1

      if (i > 1 && i < max) {
        s += args.append
      }

      if (i <= max) {
        s += " "
      }

      let bp = ""

      if (args.mode === "commands") {
        let cmd = Huebot.db.commands[p]

        if (cmd && cmd.type) {
          bp = ` (${cmd.type})`
        }
      }

      let w = ""
      let w2 = ""

      if (args.whisperify) {
        w = `[whisper ${args.whisperify}${p}]`
        w2 = "[/whisper]"
      }

      let ns = `${w}${args.prepend}${p}${bp}${w2}`

      if (s.length + ns.length > Huebot.config.max_text_length) {
        return false
      } else {
        s += ns
      }

      if (i >= max) {
        return false
      }

      return true
    }

    return s.trim()
  }

  Huebot.get_extension = function (s) {
    if (s.startsWith("http://") || s.startsWith("https://")) {
      let s2 = s.split("//").slice(1).join("//")

      let matches = s2.match(/\/.*\.(\w+)(?=$|[#?])/)

      if (matches) {
        return matches[1]
      }
    } else {
      let matches = s.match(/\.(\w+)(?=$|[#?])/)

      if (matches) {
        return matches[1]
      }
    }

    return ""
  }

  Huebot.clean_string2 = function (s) {
    return s.replace(/\s+/g, ' ').trim()
  }

  Huebot.clean_string5 = function (s) {
    return s.replace(/\s+/g, '').trim()
  }

  Huebot.clean_string10 = function (s) {
    return s.replace(/[\n\r]+/g, '\n').replace(/\s+$/g, '')
  }

  Huebot.smart_capitalize = function (s) {
    if (s.length > 2) {
      return s[0].toUpperCase() + s.slice(1)
    } else {
      return s.toUpperCase()
    }
  }

  Huebot.generate_random_controls = function () {
    let controls = ["image", "tv", "radio"]
    let strings = []

    for (let control of controls) {
      strings.push(`[whisper ${Huebot.prefix}commands random ${control}]${Huebot.smart_capitalize(control)}[/whisper]`)
    }

    return strings.join(" | ")
  }

  Huebot.clean_multiline = function (message) {
    let message_split = message.split("\n")
    let num_lines = message_split.length

    if (num_lines === 1) {
      message = message.trim()
    } else {
      let new_lines = []

      for (let line of message_split) {
        if (line.trim().length > 0) {
          new_lines.push(line)
        }
      }

      message = new_lines.join("\n")
    }

    return message
  }

  Huebot.round = function (value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals)
  }

  Huebot.rgb_to_hex = function (rgb, hash = true) {
    if (typeof rgb === "string") {
      rgb = rgb_to_array(rgb)
    }

    let code = ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1)

    if (hash) {
      code = "#" + code
    }

    return code
  }

  Huebot.rgb_to_array = function (rgb) {
    let array

    if (Array.isArray(rgb)) {
      array = []

      for (let i = 0; i < rgb.length; i++) {
        let split = rgb[i].replace("rgb(", "").replace(")", "").split(",")
        array[i] = split.map(x => parseInt(x))
      }
    } else {
      let split = rgb.replace("rgb(", "").replace(")", "").split(",")
      array = split.map(x => parseInt(x))
    }

    return array
  }

  Huebot.generate_random_drawing = function () {
    let n = Huebot.get_random_int(3, 300)

    let click_x = []
    let click_y = []
    let drag = []

    for (let i = 0; i < n; i++) {
      click_x.push(Huebot.get_random_int(0, 400))
      click_y.push(Huebot.get_random_int(0, 300))

      if (drag.length === 0) {
        drag.push(false)
      } else {
        drag.push(Huebot.get_random_int(0, 2) > 0)
      }
    }

    return [click_x, click_y, drag]
  }

  Huebot.is_command = function (message) {
    if (message.length > 1 && message[0] === Huebot.prefix && message[1] !== Huebot.prefix) {
      return true
    }

    return false
  }

  Huebot.check_public_command = function (cmd, arg) {
    if (cmd === "random") {
      if (arg) {
        if (arg !== "image" && arg !== "tv" && arg !== "radio") {
          return false
        }
      }
    }

    return true
  }

  Huebot.get_shower_thought = async function () {
    return new Promise(async (resolve, reject) =>
    {
        fetch("https://www.reddit.com/r/Showerthoughts/random.json")

        .then(res => {
          return res.json()
        })
  
        .then(res => {
          let title = res[0].data.children[0].data.title
          let url = res[0].data.children[0].data.url
          resolve({title:title, url:url})
        })
  
        .catch(err => {
          reject()
        })
    })
  }
  
  Huebot.process_feedback = function (ctx, data, s) {
    if (!s) {
      return false
    }

    if (data.method === "whisper") {
      Huebot.send_whisper(ctx, data.username, s, false)
    } else {
      Huebot.send_message(ctx, s)
    }
  }

  Huebot.get_random_user = function (ctx) {
    return ctx.userlist[Huebot.get_random_int(0, ctx.userlist.length - 1)]
  }

  Huebot.do_replacements = function (ctx, s) {
    s = s.replace(/\$user\$/gi, function () {
      return Huebot.get_random_user(ctx)
    })

    s = s.replace(/\$word\$/g, function () {
      return Huebot.get_random_word()
    })

    s = s.replace(/\$Word\$/g, function () {
      return Huebot.get_random_word("capitalized")
    })

    s = s.replace(/\$WORD\$/g, function () {
      return Huebot.get_random_word("upper_case")
    })

    return s
  }

  Huebot.set_image_source = function (ctx, src) {
    ctx.current_image_source = src
  }

  Huebot.set_tv_source = function (ctx, src) {
    ctx.current_tv_source = src
  }

  Huebot.set_radio_source = function (ctx, src) {
    ctx.current_radio_source = src
  }

  Huebot.run_commands_queue = function (ctx, id) {
    let cq = ctx.commands_queue[id]

    if (!cq) {
      delete ctx.commands_queue[id]
      return false
    }

    let cmds = cq.commands

    if (cmds.length === 0) {
      delete ctx.commands_queue[id]
      return false
    }

    let cmd = cmds.shift()

    let lc_cmd = cmd.toLowerCase()

    let obj = {
      message: cmd,
      username: cq.username,
      method: cq.method,
      callback: function () {
        Huebot.run_commands_queue(ctx, id)
      }
    }

    if (lc_cmd.startsWith(".sleep") || lc_cmd === ".sleep") {
      let n = parseInt(lc_cmd.replace(".sleep ", ""))

      if (isNaN(n)) {
        n = 1000
      }

      setTimeout(function () {
        Huebot.run_commands_queue(ctx, id)
      }, n)
    } else {
      Huebot.process_command(ctx, obj)
    }
  }

  Huebot.send_message = function (ctx, message, feedback = true) {
    if (!message) {
      return false
    }

    if (!ctx.can_chat) {
      return false
    }

    message = Huebot.do_replacements(ctx, message)
    message = Huebot.clean_string10(message.substring(0, Huebot.config.max_text_length))

    Huebot.socket_emit(ctx, 'sendchat', {
      message: message
    })
  }

  Huebot.send_whisper = function (ctx, uname, message, coords = false) {
    message = Huebot.do_replacements(ctx, message)
    message = Huebot.clean_string10(Huebot.clean_multiline(message.substring(0, Huebot.config.max_text_length)))

    Huebot.socket_emit(ctx, 'whisper', {
      type: "user",
      usernames: [uname],
      message: message,
      draw_coords: coords
    })
  }

  Huebot.send_synth_key = function (ctx, key) {
    if (!key || !ctx.can_synth) {
      return false
    }

    key = parseInt(key)

    if (typeof key !== "number") {
      return false
    }

    if (isNaN(key)) {
      return false
    }

    if (key < 1 || key > Huebot.config.num_synth_keys) {
      return false
    }

    Huebot.socket_emit(ctx, "send_synth_key", {
      key: key
    })
  }

  Huebot.send_synth_voice = function (ctx, text) {
    if (!text || !ctx.can_synth) {
      return false
    }

    text = Huebot.clean_string2(text.substring(0, 140))
    Huebot.socket_emit(ctx, "send_synth_voice", {
      text: text
    })
  }

  Huebot.change_media = function (ctx, args = {}) {
    let def_args = {
      type: "",
      src: "",
      feedback: true,
      comment: ""
    }

    Huebot.fill_defaults(args, def_args)

    if (!Huebot.config.media_types.includes(args.type)) {
      return false
    }

    if (!args.src) {
      return false
    }

    args.src = Huebot.do_replacements(ctx, args.src)

    args.src = Huebot.clean_string2(args.src)

    if (args.src.length > Huebot.db.max_media_source_length) {
      return false
    }

    if (args.type === "image") {
      if (!ctx.can_image) {
        if (args.feedback) {
          send_message(Huebot.config.no_image_error)
        }

        return false
      }

      if (ctx.current_image_source === args.src) {
        return false
      }

      Huebot.socket_emit(ctx, 'change_image_source', {
        src: args.src,
        comment: args.comment
      })
    } else if (args.type === "tv") {
      if (!ctx.can_tv) {
        if (args.feedback) {
          send_message(Huebot.config.no_tv_error)
        }

        return false
      }

      if (ctx.current_tv_source === args.src) {
        return false
      }

      Huebot.socket_emit(ctx, 'change_tv_source', {
        src: args.src,
        comment: args.comment
      })
    } else if (args.type === "radio") {
      if (!ctx.can_radio) {
        if (args.feedback) {
          send_message(Huebot.config.no_radio_error)
        }

        return false
      }

      if (ctx.current_radio_source === args.src) {
        return false
      }

      Huebot.socket_emit(ctx, 'change_radio_source', {
        src: args.src,
        comment: args.comment
      })
    }
  }

  Huebot.run_command = function (ctx, cmd, arg, data) {
    let command = Huebot.db.commands[cmd]

    if (command.type === "image") {
      Huebot.change_media(ctx, {
        type: "image",
        src: command.url,
        comment: data.comment
      })
    } else if (command.type === "tv") {
      Huebot.change_media(ctx, {
        type: "tv",
        src: command.url,
        comment: data.comment
      })
    } else if (command.type === "radio") {
      Huebot.change_media(ctx, {
        type: "radio",
        src: command.url,
        comment: data.comment
      })
    } else if (command.type === "alias") {
      let c = command.url.split(" ")[0]

      if (Huebot.command_list.includes(c)) {
        data.message = `${Huebot.prefix}${command.url} ${arg}`

        Huebot.process_command(ctx, data)
      }
    }
  }

  Huebot.check_media_permissions = function (ctx) {
    ctx.can_chat = Huebot.check_media_permission(ctx, "chat")
    ctx.can_image = ctx.room_image_mode === "enabled" && Huebot.check_media_permission(ctx, "image")
    ctx.can_tv = ctx.room_tv_mode === "enabled" && Huebot.check_media_permission(ctx, "tv")
    ctx.can_radio = ctx.room_radio_mode === "enabled" && Huebot.check_media_permission(ctx, "radio")
    ctx.can_synth = ctx.room_synth_mode === "enabled" && Huebot.check_media_permission(ctx, "synth")
  }

  Huebot.check_media_permission = function (ctx, type) {
    if (Huebot.is_admin_or_op(ctx.role)) {
      return true
    }

    return ctx.voice_permissions[`${ctx.role}_permissions`][type]
  }

  Huebot.check_op_permission = function (ctx, type) {
    if (!Huebot.is_admin_or_op(ctx.role)) {
      return false
    }

    return ctx.op_permissions[`${ctx.role}_permissions`][type]
  }

  Huebot.set_username = function (ctx, uname) {
    ctx.username = uname
  }

  Huebot.set_role = function (ctx, rol) {
    ctx.role = rol
  }

  Huebot.set_permissions = function (ctx, data) {
    ctx.voice_permissions.voice_1_permissions = data.voice_1_permissions
    ctx.voice_permissions.voice_2_permissions = data.voice_2_permissions
    ctx.voice_permissions.voice_3_permissions = data.voice_3_permissions
    ctx.voice_permissions.voice_4_permissions = data.voice_4_permissions

    ctx.op_permissions.op_1_permissions = data.op_1_permissions
    ctx.op_permissions.op_2_permissions = data.op_2_permissions
    ctx.op_permissions.op_3_permissions = data.op_3_permissions
    ctx.op_permissions.op_4_permissions = data.op_4_permissions
  }

  Huebot.set_room_enables = function (ctx, data) {
    ctx.room_image_mode = data.room_image_mode
    ctx.room_tv_mode = data.room_tv_mode
    ctx.room_radio_mode = data.room_radio_mode
    ctx.room_synth_mode = data.room_synth_mode
  }

  Huebot.socket_emit = function (ctx, destination, data) {
    let obj = {
      destination: destination,
      data: data
    }

    ctx.emit_queue.push(obj)

    if (ctx.emit_queue_timeout === undefined) {
      Huebot.check_emit_queue(ctx)
    }
  }

  Huebot.check_emit_queue = function (ctx) {
    if (ctx.emit_queue.length > 0) {
      let obj = ctx.emit_queue[0]

      if (obj !== "first") {
        Huebot.do_socket_emit(ctx, obj)
      }

      ctx.emit_queue.shift()

      ctx.emit_queue_timeout = setTimeout(function () {
        Huebot.check_emit_queue(ctx)
      }, Huebot.config.socket_emit_throttle)
    } else {
      clearTimeout(ctx.emit_queue_timeout)
      ctx.emit_queue_timeout = undefined
    }
  }

  Huebot.do_socket_emit = function (ctx, obj) {
    obj.data.server_method_name = obj.destination
    ctx.socket.emit("server_method", obj.data)
  }

  Huebot.set_theme = function (ctx, data) {
    ctx.theme_mode = data.theme_mode
    ctx.theme = data.theme
    ctx.text_color_mode = data.text_color_mode
    ctx.text_color = data.text_color
  }

  Huebot.set_background_image = function (ctx, image) {
    ctx.background_image = image
  }

  Huebot.set_background_mode = function (ctx, mode) {
    ctx.background_mode = mode
  }

  Huebot.set_background_effect = function (ctx, effect) {
    ctx.background_effect = effect
  }

  Huebot.set_background_tile_dimensions = function (ctx, dimensions) {
    ctx.background_tile_dimensions = dimensions
  }

  Huebot.set_userlist = function (ctx, data) {
    ctx.userlist = []

    for (let user of data.userlist) {
      ctx.userlist.push(user.username)
    }
  }

  Huebot.add_to_userlist = function (ctx, uname) {
    for (let u of ctx.userlist) {
      if (u === uname) {
        return false
      }
    }

    ctx.userlist.push(uname)
  }

  Huebot.remove_from_userlist = function (ctx, uname) {
    for (let i = 0; i < ctx.userlist.length; i++) {
      let u = ctx.userlist[i]

      if (u === uname) {
        ctx.userlist.splice(i, 1)
        return
      }
    }
  }

  Huebot.replace_in_userlist = function (ctx, old_uname, new_uname) {
    for (let i = 0; i < ctx.userlist.length; i++) {
      let u = ctx.userlist[i]

      if (u === old_uname) {
        ctx.userlist[i] = new_uname
        return
      }
    }
  }

  Huebot.check_reminders = function (ctx, uname) {
    if (Huebot.db.reminders[uname] === undefined || Huebot.db.reminders[uname].length === 0) {
      return false
    }

    for (let reminder of Huebot.db.reminders[uname]) {
      let s = `To: ${uname} - From: ${reminder.from}\n"${reminder.message}"`
      Huebot.send_message(ctx, s)
    }

    Huebot.db.reminders[uname] = []

    Huebot.save_file("reminders.json", Huebot.db.reminders)
  }

  Huebot.check_speech = function (ctx, data, arg) {
    let p = Math.min(100, Huebot.db.config.speak_chance_percentage)

    if (p <= 0) {
      return
    }

    let n = Huebot.get_random_int(1, 100)
    
    if (n <= (p)) {
      let n2 = Huebot.get_random_int(1, 5)

      if (n2 === 1) {
        Huebot.think({ctx:ctx, data:data, arg:arg, cmd:"think"})
      } else if (n2 === 2) {
        Huebot.think2({ctx:ctx, data:data, arg:arg, cmd:"think2"})
      } else {
        Huebot.send_message(ctx, Huebot.get_random_phrase())
      }
    }
  }

  Huebot.selective_play = function (ctx, kind, url) {
    if (kind === "image") {
      Huebot.change_media(ctx, {
        type: "image",
        src: url
      })
    } else if (kind === "tv") {
      Huebot.change_media(ctx, {
        type: "tv",
        src: url
      })
    } else if (kind === "radio") {
      Huebot.change_media(ctx, {
        type: "radio",
        src: url
      })
    }
  }

  Huebot.get_youtube_stream = function (ctx) {
    fetch(`https://www.googleapis.com/youtube/v3/search?videoEmbeddable=true&maxResults=20&type=video&eventType=live&videoCategoryId=20&fields=items(id(videoId))&part=snippet&key=${Huebot.db.config.youtube_client_id}`)

    .then(res => {
      return res.json()
    })

    .then(res => {
      if (res.items !== undefined && res.items.length > 0) {
        Huebot.shuffle_array(res.items)

        let item

        for (item of res.items) {
          if (!ctx.recent_youtube_streams.includes(item.id.videoId)) {
            break
          }
        }

        let id = item.id.videoId

        ctx.recent_youtube_streams.push(id)

        if (ctx.recent_youtube_streams.length > Huebot.config.recent_streams_max_length) {
          ctx.recent_youtube_streams.shift()
        }

        Huebot.change_media(ctx, {
          type: "tv",
          src: `https://youtube.com/watch?v=${id}`
        })
      }
    })

    .catch(err => {
      console.error(err)
    })
  }

  Huebot.find_closest = function (s, list) {
    let highest_num = 0
    let highest_cmd = ""

    for (let s2 of list) {
      let num = Huebot.string_similarity(s, s2)

      if (num > highest_num) {
        highest_num = num
        highest_cmd = s2
      }
    }

    if (highest_num >= 0.7) {
      return highest_cmd
    } else {
      return ""
    }
  }
}