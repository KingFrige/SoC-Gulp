module.exports = {
  default: {
    asicFile: {
      topModule:'dutTop',
      // flist    :'asic_syn_dut.f',
      commonFlists : [
        // process.env.CHIP_PROJECT_DIR+"/rtl/service/common/flist.f",
      ],
      memDBFlist : '',
      ipDBFlist  : '',
      techLib: [
        {
          name: 'ssDB',
          db: [
            'isf8l_ehs_generic_core_ss1p08v125c.db'
            'isf8l_ers_generic_core_ss1p08v125c.db'
          ],
          lib: [
            'isf8l_ehs_generic_core_ss1p08v125c.lib',
            'isf8l_ers_generic_core_ss1p08v125c.lib'
          ]
        },
        {
          name: 'ttDB',
          db: [
            'isf8l_ehs_generic_core_ss1p08v125c.db',
            'isf8l_ers_generic_core_ss1p08v125c.db'
          ],
          lib: [
          ]
        },
        {
          name: 'ffDB',
          db: [
          ],
          lib: [
          ]
        }
      ]
    },
    asicSyn: {
    },
    global: {
      overwrite: true,

      useFlow: [
        {flow:require('flow/asic_file.ts')},
        {flow:require('flow/asic_syn.ts')},
      ],
    }
  },
}

