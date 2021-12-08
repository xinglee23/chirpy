import * as d3 from 'd3';
// @ts-ignore
import Datamap from 'datamaps';
import { NextRouter } from 'next/router';
import React from 'react';

import * as api from '../../api';
import FadeIn from '../../fade-in';
import LazyLoader from '../../lazy-loader';
import numberFormatter from '../../number-formatter';
import { navigateToQuery } from '../../query';
import { Timer } from '../../timer';
import { Props } from '../../type';
import MoreLink from '../more-link';

interface CountriesProps extends Props {
  timer: Timer;
  router: NextRouter;
}

interface CountriesState {
  countries: any[] | null;
  darkTheme: boolean;
  loading: boolean;
}

class Countries extends React.Component<CountriesProps, CountriesState> {
  private map: Datamap;

  state = {
    loading: true,
    darkTheme: document.querySelector('html')!.classList.contains('dark') || false,
    countries: null,
  };

  componentDidUpdate(prevProps: CountriesProps) {
    if (this.props.query !== prevProps.query) {
      this.setState({ loading: true, countries: null });
      this.fetchCountries().then(this.drawMap);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeMap);
  }

  onVisible = () => {
    this.fetchCountries().then(this.drawMap.bind(this));
    window.addEventListener('resize', this.resizeMap);
    if (this.props.timer) this.props.timer.onTick(this.updateCountries.bind(this));
  };

  getDataset = () => {
    const dataset = {};

    // @ts-ignore
    const onlyValues = this.state.countries?.map(function (obj: any) {
      return obj.visitors;
    });
    const maxValue = Math.max.apply(null, onlyValues);

    const paletteScale = d3.scale
      .linear()
      .domain([0, maxValue])
      .range([
        // @ts-ignore
        this.state.darkTheme ? '#2e3954' : '#f3ebff',
        // @ts-ignore
        this.state.darkTheme ? '#6366f1' : '#a779e9',
      ]);

    // @ts-ignore
    this.state.countries?.forEach(function (item) {
      // @ts-ignore
      dataset[item.code] = {
        numberOfThings: item.visitors,
        fillColor: paletteScale(item.visitors),
      };
    });

    return dataset;
  };

  updateCountries() {
    this.fetchCountries().then(() => {
      this.map?.updateChoropleth(this.getDataset(), { reset: true });
    });
  }

  fetchCountries() {
    return api
      .get(
        `/api/stats/${encodeURIComponent(this.props.site.domain)}/countries`,
        this.props.site,
        this.props.query,
        {
          limit: 300,
        },
      )
      .then((res) => this.setState({ loading: false, countries: res }));
  }

  resizeMap = () => {
    this.map?.resize();
  };

  drawMap = () => {
    const dataset = this.getDataset();
    const label = this.props.query.period === 'realtime' ? 'Current visitors' : 'Visitors';
    const defaultFill = this.state.darkTheme ? '#2d3747' : '#f8fafc';
    const highlightFill = this.state.darkTheme ? '#374151' : '#F5F5F5';
    const borderColor = this.state.darkTheme ? '#1f2937' : '#dae1e7';
    const highlightBorderColor = this.state.darkTheme ? '#4f46e5' : '#a779e9';

    this.map = new Datamap({
      element: document.querySelector('#map-container'),
      responsive: true,
      projection: 'mercator',
      fills: { defaultFill },
      data: dataset,
      geographyConfig: {
        borderColor,
        highlightBorderWidth: 2,
        highlightFillColor: (geo: any) => geo.fillColor || highlightFill,
        highlightBorderColor,
        popupTemplate: (geo: any, data: any) => {
          if (!data) {
            return null;
          }
          const pluralizedLabel = data.numberOfThings === 1 ? label.slice(0, -1) : label;
          return [
            '<div class="hoverinfo dark:bg-gray-800 dark:shadow-gray-850 dark:border-gray-850 dark:text-gray-200">',
            '<strong>',
            geo.properties.name,
            ' </strong>',
            '<br><strong class="dark:text-indigo-400">',
            numberFormatter(data.numberOfThings),
            '</strong> ',
            pluralizedLabel,
            '</div>',
          ].join('');
        },
      },
      done: (datamap: Datamap) => {
        datamap.svg.selectAll('.datamaps-subunit').on('click', (geography: any) => {
          navigateToQuery(this.props.router, this.props.query, {
            country: geography.id,
          });
        });
      },
    });
  };

  geolocationDbNotice() {
    if (this.props.site.selfhosted) {
      return (
        <span className="text-xs text-gray-1000 absolute bottom-4 right-3">
          IP Geolocation by{' '}
          <a target="_blank" href="https://db-ip.com" rel="noreferrer" className="text-blue-1000">
            DB-IP
          </a>
        </span>
      );
    }

    return null;
  }

  renderBody() {
    if (this.state.countries) {
      return (
        <>
          <div
            className="mx-auto mt-4"
            style={{ width: '100%', maxWidth: '475px', height: '335px' }}
            id="map-container"
          ></div>
          <MoreLink site={this.props.site} list={this.state.countries} endpoint="countries" />
          {this.geolocationDbNotice()}
        </>
      );
    }

    return null;
  }

  render() {
    return (
      <LazyLoader onVisible={this.onVisible}>
        {this.state.loading && (
          <div className="mx-auto my-32 loading">
            <div></div>
          </div>
        )}
        <FadeIn show={!this.state.loading}>{this.renderBody()}</FadeIn>
      </LazyLoader>
    );
  }
}

export default Countries;
