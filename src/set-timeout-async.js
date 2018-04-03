module.exports = function setTimeoutAsync (delay = 0) {
  let id

  const promise = new Promise((res) => {
    id = setTimeout(() => {
      res()
    }, delay)
  })

  promise.clear = () => clearTimeout(id) // TODO: reject on clear
  promise.id = id

  return promise
}
