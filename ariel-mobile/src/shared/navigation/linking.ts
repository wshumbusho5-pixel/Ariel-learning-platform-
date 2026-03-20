import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: ['ariel://'],
  config: {
    screens: {
      Main: {
        screens: {
          Profile: {
            screens: {
              ProfileScreen: 'profile/:id',
            },
          },
          Deck: {
            screens: {
              DeckScreen: 'deck/:id',
            },
          },
        },
      },
      CardDetail: 'card/:id',
      DuelRoom: 'duel/:id',
    },
  },
};
