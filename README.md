# django_webpack_htmx_example
## 목적
- django에서 webpack bundling 실증
  - webpack 학습 내용 기록
- django에서 htmx 통합 실증
  - htmx 학습 내용 기록

## 목적이 아닌 것
- django + 모던 프론트엔드 프레임워크 사용
  - React, Vue 같은 것에 굳이 django를 뒤에 둘 이유가...?
    - API 기능만 제공하는 프레임워크로 대체하거나
    - 아니면 처음부터 Next.js, Nust.js를 사용하는 것이 더 나은 선택지로 보인다.


## 설치 - 2024년 기준
### 사전 준비
- python (>=3.11)
  - 가상환경 생성할 것.
- node.js  (>=18.19.0, picocss 때문)


### poetry
```bash
pip install poetry
poetry install
```

### npm
```bash
npm install
```


## 설정 - webpack
### webpack bundling 설정
딱 이 django 예제에서 사용할 만큼만 적었기(이해했기) 때문에 상세한 내용은 공식문서를 학습할 것을 권장한다.

<details>
<summary>webpack으로 bundle을 생성하기 위한 설정</summary>

#### webpack.config.js 분석
##### 설정 코드
```javascript
const path = require("path");
const BundleTracker = require("webpack-bundle-tracker");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const devMode = process.env.ENV !== "PROD";

module.exports = {
  context: __dirname,
  entry: {
    main: "./assets/js/app.js",
    css: "./assets/css/app.scss"
  },
  output: {
    path: path.resolve(__dirname, "assets/bundles/"),
    publicPath: "auto", // necessary for CDNs/S3/blob storages
    filename: "[name]-[contenthash].js",
  },
  module: {
    rules: [
      {
        test: /\.s?(c|a)ss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new BundleTracker({ path: __dirname, filename: "webpack-stats.json" }),
  ],
};
```

##### `webpack-bundle-tracker` 산출물
추가 예정


##### `entry`
의존성 파악을 위한 진입점으로 사용된다.

```javascript
module.exports = {
  entry: {
    main: "./assets/js/app.js",
    css: "./assets/css/app.scss"
  }
}
```
`main`, `css`는 `webpack-bundle-tracker`의 산출물에서 번들 식별자로 사용된다.
이를 통해 `django-webpack-loader`는 django template에서 bundle을 잘 불러오게 된다.

##### `rules`
```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.s?(c|a)ss$/,
        use: [
          devMode ? "style-loader" :MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader"
        ],
      }
    ]
  }
};
```
- test는 정규식 패턴이다.
- use는 그 경우 사용하는 loader이다.
  - 배열의 역순으로 사용되며, 처리 결과는 다음 loader에서 사용된다.
    1. sass-loader: SASS(SCSS) 파일을 CSS로 변환한다.
    2. css-loader: CSS를 CommonJS 모듈로 변환한다. JavaScript 코드에서 CSS를 불러올 수 있게 된다.
    3. style-loader 또는 `MiniCssExtractPlugin.loader`
       - style-loader: 여러 장점이 있지만 HMR(Hot Module Replacement)로 새로고침 없이 CSS 업데이트 가능해 개발환경에 적합하다.
       - `MiniCssExtractPlugin.loader`: 별도의 CSS 파일로 분리, 병렬 로드가 가능하여 운영 환경에 적합하다.
  - 위와 같이 꼬리물며 loader를 사용하는 것을 두고 ChaingingLoaders라고 지칭한다. 

##### `output`
```javascript
module.exports = {
  output: {
    path: path.resolve(__dirname, "assets/bundles/"),
    publicPath: "auto", // necessary for CDNs/S3/blob storages
    filename: "[name]-[contenthash].js",
  }
};
```
- webpack 번들링 결과를 저장하는 위치다.
  - entry 단위로 번들이 생성된다.

##### `plugins`
```javascript
module.exports = {
  plugins: [
    new MiniCssExtractPlugin(),
    new BundleTracker({ path: __dirname, filename: "webpack-stats.json" }),
  ],
};
```
- 만약 ChainingLoader처럼 순서가 중요한 경우에는 순서대로 인스턴스를 생성해야 한다.


</details>

### webpack bundle 로드 설정

<details>
<summary>django에서 bundle을 불러오기 위한 설정</summary>

#### app 추가
```python
INSTALLED_APPS = [
    ...
    'webpack_loader',
    ...
]
```
- `webpack_loader` 추가

#### 경로 설정
```python
STATICFILES_DIRS = (
    BASE_DIR / 'assets'
)

WEBPACK_LOADER = {
    'DEFAULT': {
        'BUNDLE_DIR_NAME': 'bundles/',
        'CACHE': not DEBUG,
        'STATS_FILE': BASE_DIR / 'webpack-stats.json',
        'POLL_INTERVAL': 0.1,
        'IGNORE': [r'.+\.hot-update.js', r'.+\.map'],
    }
}
```
- `STATICFILES_DIRS`는 기본 `STATIC_URL` 대신 사용된다.
- `WEBPACK_LOADER`에서 주목할 설정은 다음과 같다.
  - `BUNDLE_DIR_NAME`: `STATIC_DIR_NAME`을 기준으로 상대 경로에 있는 실제 bundle이 저장되는 디렉터리
  - `STATS_FILE`: django template engine에서 사용할 번들 정보를 담고 있는 `webpack-bundle-tracker`의 산출물 경로


</details>

### 최상위 template에 설정

<details>
<summary>최상위 template에 설정</summary>
작성예정

</details>

## 설정 - htmx
### django settings.py 설정

<details>
<summary>htmx django 설정</summary>

#### app 추가
```python
INSTALLED_APPS = [
    ...
    'django_htmx',
    ...
]
```
- `django_htmx` 추가

#### middlware 추가
```python
MIDDLEWARE = [
    ...
    'django_htmx.middleware.HtmxMiddleware',
    ...
]
```
- `django_htmx.middleware.HtmxMiddleware` 추가

</details>


## 원문
### 의존성
- [공식문서: Pico css](https://picocss.com/docs/sass)

### webpack
- [blog: [Webpack] css-loader & style-loader](https://heecheolman.tistory.com/33)
- [예제: django-webpack-loader simple](https://github.com/django-webpack/django-webpack-loader/tree/master/examples/simple)

### htmx
- 작성 예정