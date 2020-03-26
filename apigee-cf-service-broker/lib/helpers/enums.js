module.exports = {
  SERVICE_PLANS: {
    org: 'org',
    micro: 'micro',
    microc2c: 'micro_c2c',
    microCoresident: 'micro_coresident',
    portal: 'portal'
  },
  API_PRODUCT: {
    defaults: {
      quota: 1,
      quotaInterval: 1,
      quotaTimeUnit: 'second'
    },
    approvalType: {
      manual: 'manual',
      auto: 'auto'
    },
    attributes: {
      access: {
        private: 'private',
        public: 'public'
      }
    }
  },
  SPEC_KINDS: {
    doc: 'Doc'
  },
  VERBS: ['proxy', 'bind']
}