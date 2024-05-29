const fs = require('fs')
const db = require('../models/index')

const run = () => {
    db.models.Stores.find({
        'offers': {$ne: []}
    },{logo:1,name:1,domain:1}).exec().then((stores) => {
        const list = stores.map((item) => {
            const logo = item?.logo || null
            const path = `${__dirname.split('/').slice(0,-2).join('/')}/frontend/apps/frontend/public/${logo}`
            if(!fs.existsSync(path) && item.name && item.domain && logo){
                return {
                    name: item.name.replace(/,/gui, ' ').trim(),
                    domain: item.domain.replace(/,/gui, ' ').trim(),
                    logo
                }
            }
            return null
        })
        const missFile = list.filter(item => item!==null)
        const csv = []
        const header = ['name','domain']
        missFile.forEach(element => {
            csv.push(`${element.name},${element.domain}`)
        })
        fs.writeFileSync('reports/missing-logo.csv', `${header.join(',')}\r\n${csv.join('\r\n')}`)
        process.exit()
    })
}

module.exports = {
    run
}