export const corsOptions = {
  origin: function (origin: any, callback: any): any {
    return callback(null, true)
  },

  // Some legacy browsers (IE11, various SmartTVs) choke on 204
  optionsSuccessStatus: 200,

  // allow receive cookies from request
  credentials: true,
}
